import { json } from '@sveltejs/kit';
import { getPool } from '$lib/server/database.js';
import { log } from '$lib/server/logger.js';
import type { RequestHandler } from './$types.js';

// GET /api/sessions/[sessionCode]/rounds - Get all rounds for a session
export const GET: RequestHandler = async ({ params }) => {
	const { sessionCode } = params;
	const pool = getPool();

	try {
		// Get all rounds for the session
		const roundsResult = await pool.query(
			`
			SELECT 
				vr.id,
				vr.round_number,
				vr.description,
				vr.vote_average,
				vr.final_estimate,
				vr.created_at,
				vr.completed_at
			FROM voting_rounds vr
			WHERE vr.session_code = $1
			ORDER BY vr.round_number ASC
		`,
			[sessionCode]
		);

		const rounds = [];

		for (const round of roundsResult.rows) {
			// Get votes for this round
			const votesResult = await pool.query(
				`
				SELECT participant_name, vote
				FROM round_votes
				WHERE round_id = $1
				ORDER BY participant_name ASC
			`,
				[round.id]
			);

			const votes: { [key: string]: string } = {};
			votesResult.rows.forEach((row) => {
				votes[row.participant_name] = row.vote;
			});

			rounds.push({
				roundNumber: round.round_number,
				description: round.description,
				votes,
				voteAverage: round.vote_average || '',
				finalEstimate: round.final_estimate || '',
				timestamp: new Date(round.created_at).getTime()
			});
		}

		return json({ rounds });
	} catch (error) {
		log.databaseError(`Error fetching rounds for session ${sessionCode}`, error);
		return json({ error: 'Failed to fetch rounds' }, { status: 500 });
	}
};

// POST /api/sessions/[sessionCode]/rounds - Create a new round
export const POST: RequestHandler = async ({ request, params }) => {
	const { sessionCode } = params;
	const pool = getPool();

	try {
		const { roundNumber, description, votes, voteAverage, finalEstimate } = await request.json();

		// Start transaction
		const client = await pool.connect();
		try {
			await client.query('BEGIN');

			// Insert the round
			const roundResult = await client.query(
				`
				INSERT INTO voting_rounds (session_code, round_number, description, vote_average, final_estimate, completed_at)
				VALUES ($1, $2, $3, $4, $5, NOW())
				RETURNING id
			`,
				[sessionCode, roundNumber, description, voteAverage, finalEstimate]
			);

			const roundId = roundResult.rows[0].id;

			// Insert individual votes
			for (const [participantName, vote] of Object.entries(votes)) {
				await client.query(
					`
					INSERT INTO round_votes (round_id, participant_name, vote)
					VALUES ($1, $2, $3)
					ON CONFLICT (round_id, participant_name) 
					DO UPDATE SET vote = EXCLUDED.vote
				`,
					[roundId, participantName, vote]
				);
			}

			await client.query('COMMIT');

			log.database(
				`Saved round ${roundNumber} for session ${sessionCode} with ${Object.keys(votes).length} votes`
			);

			return json({ success: true, roundId });
		} catch (error) {
			await client.query('ROLLBACK');
			throw error;
		} finally {
			client.release();
		}
	} catch (error) {
		log.databaseError(`Error creating round for session ${sessionCode}`, error);
		return json({ error: 'Failed to create round' }, { status: 500 });
	}
};
