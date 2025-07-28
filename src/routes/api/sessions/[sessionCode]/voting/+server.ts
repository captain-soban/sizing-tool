import { json } from '@sveltejs/kit';
import { ServerSessionStore } from '$lib/server/sessionStore';
import { broadcastSessionUpdate } from '../events/+server';
import type { RequestHandler } from './$types';

// PATCH /api/sessions/[sessionCode]/voting - Update voting state
export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const { sessionCode } = params;
		const votingUpdates = await request.json();

		const session = ServerSessionStore.updateVotingState(sessionCode, votingUpdates);

		if (!session) {
			return json({ error: 'Session not found' }, { status: 404 });
		}

		// Broadcast update to all connected clients
		broadcastSessionUpdate(sessionCode);

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

// POST /api/sessions/[sessionCode]/voting/reset - Reset votes and start new voting
export const POST: RequestHandler = async ({ params }) => {
	try {
		const { sessionCode } = params;

		const session = ServerSessionStore.resetVotes(sessionCode);

		if (!session) {
			return json({ error: 'Session not found' }, { status: 404 });
		}

		// Broadcast update to all connected clients
		broadcastSessionUpdate(sessionCode);

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
