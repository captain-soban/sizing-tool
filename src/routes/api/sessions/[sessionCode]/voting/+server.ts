import { json } from '@sveltejs/kit';
import { PostgresSessionStore } from '$lib/server/postgresSessionStore';
import { broadcastSessionUpdate, getSessionConnectionStatus } from '$lib/server/sseUtils';
import type { RequestHandler } from './$types';

// PATCH /api/sessions/[sessionCode]/voting - Update voting state
export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const { sessionCode } = params;
		const votingUpdates = await request.json();
		const { hostUserId, hostPlayerName, ...rawVotingUpdates } = votingUpdates;

		const isHost = await PostgresSessionStore.isSessionHost(
			sessionCode,
			hostUserId,
			hostPlayerName
		);
		if (!isHost) {
			return json({ error: 'Host authorization required' }, { status: 403 });
		}

		if (rawVotingUpdates.votesRevealed === true) {
			const currentSession = await PostgresSessionStore.getSession(sessionCode);
			if (!currentSession) {
				return json({ error: 'Session not found' }, { status: 404 });
			}

			const participantsWithConnectionStatus = getSessionConnectionStatus(
				currentSession.participants,
				sessionCode
			);
			const votes = participantsWithConnectionStatus
				.filter(
					(p) =>
						!p.isObserver && p.vote && p.vote !== '?' && !Number.isNaN(Number.parseFloat(p.vote))
				)
				.map((p) => Number.parseFloat(p.vote!));

			rawVotingUpdates.voteAverage =
				votes.length > 0
					? (votes.reduce((sum, vote) => sum + vote, 0) / votes.length).toFixed(1)
					: '';
		}

		const session = await PostgresSessionStore.updateVotingState(sessionCode, rawVotingUpdates);

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
