import { json } from '@sveltejs/kit';
import { PostgresSessionStore } from '$lib/server/postgresSessionStore';
import { broadcastSessionUpdate } from '$lib/server/sseUtils';
import type { RequestHandler } from './$types';

// POST /api/sessions/[sessionCode]/join - Join existing session
export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { sessionCode } = params;
		const { playerName, userId, isObserver = false } = await request.json();

		if (!playerName || typeof playerName !== 'string') {
			return json({ error: 'Player name is required' }, { status: 400 });
		}

		if (!userId || typeof userId !== 'string') {
			return json({ error: 'User ID is required' }, { status: 400 });
		}

		const session = await PostgresSessionStore.joinSession(sessionCode, playerName, userId, isObserver);

		if (!session) {
			return json({ error: 'Session not found' }, { status: 404 });
		}

		// Broadcast update to all connected clients
		await broadcastSessionUpdate(sessionCode);

		return json({
			sessionCode: session.sessionCode,
			title: session.title,
			participants: session.participants,
			votingState: session.votingState,
			storyPointScale: session.storyPointScale,
			lastUpdated: session.lastUpdated
		});
	} catch (error) {
		console.error('[API] Error joining session:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
