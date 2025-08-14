import { PostgresSessionStore } from '$lib/server/postgresSessionStore';
import {
	sessionConnections,
	addParticipantConnection,
	removeParticipantConnection,
	getSessionConnectionStatus
} from '$lib/server/sseUtils';
import { performLazyCleanup } from '$lib/server/lazyCleanup';
import type { RequestHandler } from './$types';

// Extended controller type with cleanup function
interface ExtendedController extends ReadableStreamDefaultController {
	cleanup?: () => void;
}

// Extended stream type with cleanup function
interface ExtendedStream {
	cleanup?: () => void;
}

// GET /api/sessions/[sessionCode]/events - Server-Sent Events endpoint
export const GET: RequestHandler = async ({ params, url }) => {
	const { sessionCode } = params;
	const playerName = url.searchParams.get('playerName');

	// Perform lazy cleanup
	performLazyCleanup().catch((error) => {
		console.error('[SSE] Lazy cleanup error:', error);
	});

	// Verify session exists
	const session = await PostgresSessionStore.getSession(sessionCode);
	if (!session) {
		return new Response('Session not found', { status: 404 });
	}

	const stream = new ReadableStream({
		start(controller) {
			console.log(
				`[SSE] Client connected to session ${sessionCode}${playerName ? ` as ${playerName}` : ''}`
			);

			// Add this controller to the session's connections
			if (!sessionConnections.has(sessionCode)) {
				sessionConnections.set(sessionCode, new Set());
			}
			sessionConnections.get(sessionCode)!.add(controller);

			// Add participant connection tracking if playerName is provided
			if (playerName) {
				addParticipantConnection(sessionCode, playerName, controller);
			}

			// Send initial session data
			PostgresSessionStore.getSession(sessionCode)
				.then((currentSession) => {
					if (currentSession) {
						// Update participants with real-time connection status
						const participantsWithConnectionStatus = getSessionConnectionStatus(
							currentSession.participants,
							sessionCode
						);

						const data = JSON.stringify({
							type: 'session-update',
							sessionCode: currentSession.sessionCode,
							title: currentSession.title,
							participants: participantsWithConnectionStatus,
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

			// Send periodic heartbeat - optimized frequency
			const heartbeatInterval = setInterval(() => {
				try {
					controller.enqueue(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
				} catch {
					console.log(`[SSE] Heartbeat failed for ${sessionCode}, cleaning up`);
					clearInterval(heartbeatInterval);
					sessionConnections.get(sessionCode)?.delete(controller);
				}
			}, 60000); // 60 seconds - reduced frequency for better performance

			// Cleanup on connection close
			const cleanup = () => {
				console.log(
					`[SSE] Client disconnected from session ${sessionCode}${playerName ? ` (${playerName})` : ''}`
				);
				clearInterval(heartbeatInterval);

				// Remove from session connections
				const connections = sessionConnections.get(sessionCode);
				if (connections) {
					connections.delete(controller);
					if (connections.size === 0) {
						sessionConnections.delete(sessionCode);
					}
				}

				// Remove participant connection tracking
				if (playerName) {
					removeParticipantConnection(sessionCode, playerName);
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
