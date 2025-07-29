import { PostgresSessionStore } from './postgresSessionStore';

// Keep track of active SSE connections per session
export const sessionConnections = new Map<string, Set<ReadableStreamDefaultController>>();

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

	const data = JSON.stringify({
		type: 'session-update',
		sessionCode: session.sessionCode,
		title: session.title,
		participants: session.participants,
		votingState: session.votingState,
		storyPointScale: session.storyPointScale,
		lastUpdated: session.lastUpdated
	});

	const deadConnections = new Set<ReadableStreamDefaultController>();

	connections.forEach((controller) => {
		try {
			controller.enqueue(`data: ${data}\n\n`);
		} catch (error) {
			console.log(`[SSE] Failed to send update to ${sessionCode}:`, error);
			deadConnections.add(controller);
		}
	});

	// Remove dead connections
	deadConnections.forEach((controller) => {
		connections.delete(controller);
	});

	if (connections.size === 0) {
		sessionConnections.delete(sessionCode);
	}

	console.log(`[SSE] Broadcasted update to ${connections.size} clients in session ${sessionCode}`);
}
