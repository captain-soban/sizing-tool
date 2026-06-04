import { json } from '@sveltejs/kit';
import { PostgresSessionStore } from '$lib/server/postgresSessionStore';
import { batchSessionUpdate, broadcastSessionUpdate } from '$lib/server/sseUtils';
import type { RequestHandler } from './$types';

// PATCH /api/sessions/[sessionCode]/participants/[playerName] - Update participant
export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const { sessionCode, playerName } = params;
		const { userId, ...updates } = await request.json();

		if (!userId || typeof userId !== 'string') {
			return json({ error: 'Participant authorization required' }, { status: 403 });
		}

		const isParticipant = await PostgresSessionStore.isSessionParticipant(
			sessionCode,
			playerName,
			userId
		);
		if (!isParticipant) {
			return json({ error: 'Participant authorization required' }, { status: 403 });
		}

		const session = await PostgresSessionStore.updateParticipant(sessionCode, playerName, updates);

		if (!session) {
			return json({ error: 'Session or participant not found' }, { status: 404 });
		}

		const shouldBroadcastImmediately =
			updates.voted !== undefined || 'vote' in updates || updates.isObserver !== undefined;

		if (shouldBroadcastImmediately) {
			await broadcastSessionUpdate(sessionCode);
		} else {
			// Heartbeats and other background touches can stay batched.
			batchSessionUpdate(sessionCode);
		}

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

// DELETE /api/sessions/[sessionCode]/participants/[playerName] - Remove participant
export const DELETE: RequestHandler = async ({ params, request }) => {
	try {
		const { sessionCode, playerName } = params;
		const { hostUserId, hostPlayerName } = await request.json().catch(() => ({}));

		const isHost = await PostgresSessionStore.isSessionHost(
			sessionCode,
			hostUserId,
			hostPlayerName
		);
		if (!isHost) {
			return json({ error: 'Host authorization required' }, { status: 403 });
		}

		const session = await PostgresSessionStore.removeParticipant(sessionCode, playerName);

		if (!session) {
			return json({ error: 'Session or participant not found' }, { status: 404 });
		}

		// Optimized: Use batched updates instead of immediate broadcast
		batchSessionUpdate(sessionCode);

		return json({
			sessionCode: session.sessionCode,
			title: session.title,
			participants: session.participants,
			votingState: session.votingState,
			storyPointScale: session.storyPointScale,
			lastUpdated: session.lastUpdated
		});
	} catch (error) {
		console.error('[API] Error removing participant:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
