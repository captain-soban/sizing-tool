import { PostgresSessionStore } from '$lib/server/postgresSessionStore';
import type { RequestHandler } from './$types';

// Keep track of active SSE connections per session
const sessionConnections = new Map<string, Set<ReadableStreamDefaultController>>();

// Extended controller type with cleanup function
interface ExtendedController extends ReadableStreamDefaultController {
	cleanup?: () => void;
}

// Extended stream type with cleanup function
interface ExtendedStream {
	cleanup?: () => void;
}

// GET /api/sessions/[sessionCode]/events - Server-Sent Events endpoint
export const GET: RequestHandler = async ({ params }) => {
	const { sessionCode } = params;

	// Verify session exists
	const session = await PostgresSessionStore.getSession(sessionCode);
	if (!session) {
		return new Response('Session not found', { status: 404 });
	}

	const stream = new ReadableStream({
		start(controller) {
			console.log(`[SSE] Client connected to session ${sessionCode}`);

			// Add this controller to the session's connections
			if (!sessionConnections.has(sessionCode)) {
				sessionConnections.set(sessionCode, new Set());
			}
			sessionConnections.get(sessionCode)!.add(controller);

			// Send initial session data
			PostgresSessionStore.getSession(sessionCode)
				.then((currentSession) => {
					if (currentSession) {
						const data = JSON.stringify({
							type: 'session-update',
							sessionCode: currentSession.sessionCode,
							title: currentSession.title,
							participants: currentSession.participants,
							votingState: currentSession.votingState,
							storyPointScale: currentSession.storyPointScale,
							lastUpdated: currentSession.lastUpdated
						});

						try {
							controller.enqueue(`data: ${data}\n\n`);
						} catch (error) {
							console.log(`[SSE] Failed to send initial data to ${sessionCode}:`, error);
						}
					}
				})
				.catch((error) => {
					console.error(`[SSE] Error loading initial session data:`, error);
				});

			// Send periodic heartbeat
			const heartbeatInterval = setInterval(() => {
				try {
					controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
				} catch {
					console.log(`[SSE] Heartbeat failed for ${sessionCode}, cleaning up`);
					clearInterval(heartbeatInterval);
					sessionConnections.get(sessionCode)?.delete(controller);
				}
			}, 30000); // 30 seconds

			// Cleanup on connection close
			const cleanup = () => {
				console.log(`[SSE] Client disconnected from session ${sessionCode}`);
				clearInterval(heartbeatInterval);
				const connections = sessionConnections.get(sessionCode);
				if (connections) {
					connections.delete(controller);
					if (connections.size === 0) {
						sessionConnections.delete(sessionCode);
					}
				}
			};

			// Store cleanup function for later use
			(controller as ExtendedController).cleanup = cleanup;
		},

		cancel() {
			// Call cleanup when stream is cancelled
			const cleanupFn = (this as ExtendedStream).cleanup;
			if (cleanupFn) {
				cleanupFn();
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': 'Cache-Control'
		}
	});
};

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
