import { json } from '@sveltejs/kit';
import { PostgresSessionStore } from '$lib/server/postgresSessionStore';
import { broadcastSessionUpdate } from '$lib/server/sseUtils';
import { log } from '$lib/server/logger.js';
import { getPool } from '$lib/server/database.js';
import type { RequestHandler } from './$types.js';

export interface CreateRoundRequest {
	newRoundDescription: string;
	completeCurrentRound?: boolean;
	voteAverage?: string;
	finalEstimate?: string;
}

// POST /api/sessions/[sessionCode]/rounds/create - Create a new voting round
export const POST: RequestHandler = async ({ request, params }) => {
	const { sessionCode } = params;

	try {
		const {
			newRoundDescription,
			completeCurrentRound = false,
			voteAverage,
			finalEstimate
		}: CreateRoundRequest = await request.json();

		// Get current session state
		const currentSession = await PostgresSessionStore.getSession(sessionCode);
		if (!currentSession) {
			return json({ error: 'Session not found' }, { status: 404 });
		}

		// Validate input - description is now optional, generate default if empty
		const description =
			newRoundDescription?.trim() || `Round ${currentSession.votingState.currentRound + 1}`;

		const pool = getPool();
		let completedRoundData = null;

		try {
			await pool.query('BEGIN');

			// Step 1: Complete current round if requested and there are votes
			if (
				completeCurrentRound &&
				(voteAverage || currentSession.participants.some((p) => p.vote))
			) {
				// Collect current votes
				const votes: { [key: string]: string } = {};
				currentSession.participants.forEach((p) => {
					if (p.vote) {
						votes[p.name] = p.vote;
					}
				});

				// Save the current round
				const roundResult = await pool.query(
					`INSERT INTO voting_rounds (session_code, round_number, description, vote_average, final_estimate, completed_at)
					 VALUES ($1, $2, $3, $4, $5, NOW())
					 RETURNING id`,
					[
						sessionCode,
						currentSession.votingState.currentRound,
						currentSession.votingState.currentRoundDescription,
						voteAverage || '',
						finalEstimate || voteAverage || ''
					]
				);

				const roundId = roundResult.rows[0].id;

				// Save individual votes
				for (const [participantName, vote] of Object.entries(votes)) {
					await pool.query(
						`INSERT INTO round_votes (round_id, participant_name, vote)
						 VALUES ($1, $2, $3)`,
						[roundId, participantName, vote]
					);
				}

				completedRoundData = {
					roundNumber: currentSession.votingState.currentRound,
					description: currentSession.votingState.currentRoundDescription,
					votes,
					voteAverage: voteAverage || '',
					finalEstimate: finalEstimate || voteAverage || '',
					timestamp: Date.now()
				};

				log.database(
					`Completed round ${currentSession.votingState.currentRound} for session ${sessionCode}`
				);
			}

			// Step 2: Start new round
			const newRoundNumber = currentSession.votingState.currentRound + 1;

			// Reset all participant votes
			await pool.query(
				`UPDATE participants 
				 SET voted = FALSE, vote = NULL, last_seen = NOW()
				 WHERE session_code = $1`,
				[sessionCode]
			);

			// Update session with new round information
			await pool.query(
				`UPDATE sessions 
				 SET voting_in_progress = TRUE, votes_revealed = FALSE, 
				     vote_average = '', final_estimate = '',
				     current_round = $2, current_round_description = $3,
				     updated_at = NOW()
				 WHERE session_code = $1`,
				[sessionCode, newRoundNumber, description]
			);

			await pool.query('COMMIT');

			log.database(
				`Created new round ${newRoundNumber} for session ${sessionCode}: "${description}"`
			);

			// Get updated session data
			const updatedSession = await PostgresSessionStore.getSession(sessionCode);
			if (!updatedSession) {
				throw new Error('Failed to retrieve updated session');
			}

			// Broadcast update to all connected clients
			await broadcastSessionUpdate(sessionCode);

			return json({
				success: true,
				newRoundNumber,
				completedRound: completedRoundData,
				sessionData: {
					sessionCode: updatedSession.sessionCode,
					title: updatedSession.title,
					participants: updatedSession.participants,
					votingState: updatedSession.votingState,
					storyPointScale: updatedSession.storyPointScale,
					lastUpdated: updatedSession.lastUpdated
				}
			});
		} catch (error) {
			await pool.query('ROLLBACK');
			throw error;
		}
	} catch (error) {
		log.databaseError(`Error creating new round for session ${sessionCode}`, error);
		return json({ error: 'Failed to create new round' }, { status: 500 });
	}
};
