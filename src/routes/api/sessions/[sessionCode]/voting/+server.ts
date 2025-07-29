import { json } from '@sveltejs/kit';
import { PostgresSessionStore } from '$lib/server/postgresSessionStore';
import { broadcastSessionUpdate } from '$lib/server/sseUtils';
import type { RequestHandler } from './$types';

// PATCH /api/sessions/[sessionCode]/voting - Update voting state
export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const { sessionCode } = params;
		const votingUpdates = await request.json();

		const session = await PostgresSessionStore.updateVotingState(sessionCode, votingUpdates);

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
		console.error('[API] Error updating voting state:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
