import { json } from '@sveltejs/kit';
import { PostgresSessionStore } from '$lib/server/postgresSessionStore';
import { broadcastSessionUpdate } from '../../events/+server';
import type { RequestHandler } from './$types';

// PATCH /api/sessions/[sessionCode]/participants/[playerName] - Update participant
export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const { sessionCode, playerName } = params;
		const updates = await request.json();

		const session = await PostgresSessionStore.updateParticipant(sessionCode, playerName, updates);

		if (!session) {
			return json({ error: 'Session or participant not found' }, { status: 404 });
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
		console.error('[API] Error updating participant:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
