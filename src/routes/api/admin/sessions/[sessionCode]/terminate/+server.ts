import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PostgresSessionStore } from '$lib/server/postgresSessionStore';

export const POST: RequestHandler = async ({ params }) => {
	try {
		const { sessionCode } = params;

		if (!sessionCode) {
			return json({ error: 'Session code is required' }, { status: 400 });
		}

		const session = await PostgresSessionStore.getSession(sessionCode);

		if (!session) {
			return json({ error: 'Session not found' }, { status: 404 });
		}

		// For PostgreSQL, we'll mark all participants as disconnected by updating their last_seen to old timestamp
		const pool = await import('$lib/server/database').then((m) => m.getPool());
		await pool.query(
			"UPDATE participants SET last_seen = NOW() - INTERVAL '10 minutes' WHERE session_code = $1",
			[sessionCode]
		);

		return json({ success: true });
	} catch (error) {
		console.error('Error terminating session:', error);
		return json({ error: 'Failed to terminate session' }, { status: 500 });
	}
};
