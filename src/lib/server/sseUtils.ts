import { PostgresSessionStore } from './postgresSessionStore';
import type { Participant } from '$lib/stores/session';

// Keep track of active SSE connections per session
export const sessionConnections = new Map<string, Set<ReadableStreamDefaultController>>();

// Track participant connection status per session
// Key format: "sessionCode:playerName" -> controller
export const participantConnections = new Map<string, ReadableStreamDefaultController>();

// Optimization: Batch SSE updates to reduce server load
const pendingUpdates = new Map<string, NodeJS.Timeout>();
const UPDATE_BATCH_DELAY = 1000; // 1 second batch delay

// Add participant connection tracking
export function addParticipantConnection(
	sessionCode: string,
	playerName: string,
	controller: ReadableStreamDefaultController
): void {
	const key = `${sessionCode}:${playerName}`;
	participantConnections.set(key, controller);
	console.log(`[SSE] Added participant connection: ${key}`);

	// Trigger batched session update
	batchSessionUpdate(sessionCode);
}

// Remove participant connection tracking
export function removeParticipantConnection(sessionCode: string, playerName: string): void {
	const key = `${sessionCode}:${playerName}`;
	participantConnections.delete(key);
	console.log(`[SSE] Removed participant connection: ${key}`);

	// Trigger batched session update
	batchSessionUpdate(sessionCode);
}

// Check if participant is connected via SSE
export function isParticipantConnected(sessionCode: string, playerName: string): boolean {
	const key = `${sessionCode}:${playerName}`;
	const controller = participantConnections.get(key);

	if (!controller) {
		return false;
	}

	// Check if controller is still writable
	return controller.desiredSize !== null;
}

// Get connection status for all participants in a session
export function getSessionConnectionStatus(
	participants: Participant[],
	sessionCode: string
): Participant[] {
	return participants.map((participant) => ({
		...participant,
		isConnected: participant.isHost || isParticipantConnected(sessionCode, participant.name)
	}));
}

// Batch session updates to reduce SSE broadcast frequency
export function batchSessionUpdate(sessionCode: string): void {
	// Clear existing timeout for this session
	const existingTimeout = pendingUpdates.get(sessionCode);
	if (existingTimeout) {
		clearTimeout(existingTimeout);
	}

	// Set new batched update
	const timeout = setTimeout(() => {
		broadcastSessionUpdate(sessionCode).catch((error) => {
			console.error(`[SSE] Error in batched session update for ${sessionCode}:`, error);
		});
		pendingUpdates.delete(sessionCode);
	}, UPDATE_BATCH_DELAY);

	pendingUpdates.set(sessionCode, timeout);
}

// Function to broadcast updates to all connected clients in a session
export async function broadcastSessionUpdate(sessionCode: string) {
	const connections = sessionConnections.get(sessionCode);
	if (!connections || connections.size === 0) {
		return;
	}

	const session = await PostgresSessionStore.getSession(sessionCode);
	if (!session) {
		return;
	}

	// Update participants with real-time connection status
	const participantsWithConnectionStatus = getSessionConnectionStatus(
		session.participants,
		sessionCode
	);

	const data = JSON.stringify({
		type: 'session-update',
		sessionCode: session.sessionCode,
		title: session.title,
		participants: participantsWithConnectionStatus,
		votingState: session.votingState,
		storyPointScale: session.storyPointScale,
		lastUpdated: session.lastUpdated
	});

	const deadConnections = new Set<ReadableStreamDefaultController>();

	connections.forEach((controller) => {
		try {
			// Check if controller is still writable before trying to enqueue
			if (controller.desiredSize !== null) {
				controller.enqueue(`data: ${data}\n\n`);
			} else {
				// Controller is closed, mark for removal
				deadConnections.add(controller);
			}
		} catch (error) {
			console.log(
				`[SSE] Failed to send update to ${sessionCode}:`,
				error instanceof Error ? error.message : String(error)
			);
			deadConnections.add(controller);
		}
	});

	// Remove dead connections
	deadConnections.forEach((controller) => {
		connections.delete(controller);

		// Also clean up participant connections
		for (const [key, participantController] of participantConnections.entries()) {
			if (participantController === controller) {
				participantConnections.delete(key);
				console.log(`[SSE] Cleaned up participant connection: ${key}`);
			}
		}
	});

	if (connections.size === 0) {
		sessionConnections.delete(sessionCode);
	}

	const activeConnections = connections.size;
	if (activeConnections > 0) {
		console.log(
			`[SSE] Broadcasted update to ${activeConnections} clients in session ${sessionCode}`
		);
	}
}
