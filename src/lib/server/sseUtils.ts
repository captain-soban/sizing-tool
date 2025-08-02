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
