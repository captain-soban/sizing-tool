import { json } from '@sveltejs/kit';
import { getPool } from '$lib/server/database.js';
import { log } from '$lib/server/logger.js';
import type { RequestHandler } from './$types.js';

// POST /api/sessions/[sessionCode]/participants/[playerName]/track - Track participant joining session
export const POST: RequestHandler = async ({ request, params }) => {
	const { sessionCode, playerName } = params;
	const pool = getPool();

	try {
		const { userId, isHost } = await request.json();

		if (!userId) {
			return json({ error: 'User ID is required' }, { status: 400 });
		}

		// Track participant session
		await pool.query(
			`
			INSERT INTO participant_sessions (user_id, session_code, participant_name, is_host, first_joined, last_active)
			VALUES ($1, $2, $3, $4, NOW(), NOW())
			ON CONFLICT (user_id, session_code, participant_name)
			DO UPDATE SET 
				last_active = NOW(),
				is_host = EXCLUDED.is_host
		`,
			[userId, sessionCode, playerName, isHost]
		);

		log.database(
			`Tracked participant ${playerName} (${userId}) joining session ${sessionCode} as ${isHost ? 'host' : 'participant'}`
		);

		return json({ success: true });
	} catch (error) {
		log.databaseError(`Error tracking participant ${playerName} in session ${sessionCode}`, error);
		return json({ error: 'Failed to track participant' }, { status: 500 });
	}
};
