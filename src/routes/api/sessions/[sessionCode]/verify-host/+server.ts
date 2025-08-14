import { json } from '@sveltejs/kit';
import { PostgresSessionStore } from '$lib/server/postgresSessionStore';
import type { RequestHandler } from './$types';

// POST /api/sessions/[sessionCode]/verify-host - Check if user is original host
export const POST: RequestHandler = async ({ params, request }) => {
	try {
		const { sessionCode } = params;
		const { userId, playerName } = await request.json();

		if (!userId || !playerName) {
			return json({ error: 'Missing userId or playerName' }, { status: 400 });
		}

		const isHost = await PostgresSessionStore.isOriginalHost(sessionCode, userId, playerName);

		return json({ isHost });
	} catch (error) {
		console.error('[API] Error verifying host status:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
