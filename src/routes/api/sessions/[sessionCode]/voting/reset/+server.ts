import { json } from '@sveltejs/kit';
import { PostgresSessionStore } from '$lib/server/postgresSessionStore';
import { broadcastSessionUpdate } from '$lib/server/sseUtils';
import type { RequestHandler } from './$types';

// POST /api/sessions/[sessionCode]/voting/reset - Reset votes and start new voting
export const POST: RequestHandler = async ({ params }) => {
	try {
		const { sessionCode } = params;

		const session = await PostgresSessionStore.resetVotes(sessionCode);

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
		console.error('[API] Error resetting votes:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
