import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPool } from '$lib/server/database';

export const GET: RequestHandler = async ({ params }) => {
	const { userId } = params;

	if (!userId) {
		return json({ error: 'User ID is required' }, { status: 400 });
	}

	try {
		const db = getPool();

		// Get user's sessions from participant_sessions table with session details
		const result = await db.query(
			`
			SELECT 
				ps.session_code,
				ps.participant_name,
				ps.is_host,
				ps.last_active,
				s.title as session_title
			FROM participant_sessions ps
			JOIN sessions s ON ps.session_code = s.session_code
			WHERE ps.user_id = $1
			ORDER BY ps.last_active DESC
			LIMIT 10
		`,
			[userId]
		);

		// Transform the results to match RecentSession interface
		const sessions = result.rows.map((row) => ({
			sessionCode: row.session_code,
			playerName: row.participant_name,
			sessionTitle: row.session_title || undefined,
			isHost: row.is_host,
			lastAccessed: new Date(row.last_active).getTime(),
			userId: userId
		}));

		return json({ sessions });
	} catch (error) {
		console.error('[API] Error fetching user sessions:', error);
		return json({ error: 'Failed to fetch user sessions' }, { status: 500 });
	}
};
