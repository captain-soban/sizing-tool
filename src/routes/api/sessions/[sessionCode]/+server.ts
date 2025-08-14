import { json } from '@sveltejs/kit';
import { PostgresSessionStore } from '$lib/server/postgresSessionStore';
import { broadcastSessionUpdate } from '$lib/server/sseUtils';
import { performLazyCleanup } from '$lib/server/lazyCleanup';
import type { RequestHandler } from './$types';

// GET /api/sessions/[sessionCode] - Get session details
export const GET: RequestHandler = async ({ params }) => {
	try {
		// Perform lazy cleanup
		performLazyCleanup().catch((error) => {
			console.error('[API] Lazy cleanup error:', error);
		});
		const { sessionCode } = params;
		const session = await PostgresSessionStore.getSession(sessionCode);

		if (!session) {
			return json({ error: 'Session not found' }, { status: 404 });
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
		console.error('[API] Error getting session:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// PATCH /api/sessions/[sessionCode] - Update session details
export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		// Perform lazy cleanup
		performLazyCleanup().catch((error) => {
			console.error('[API] Lazy cleanup error:', error);
		});
		const { sessionCode } = params;
		const updates = await request.json();

		let session = null;

		if (updates.title && typeof updates.title === 'string') {
			session = await PostgresSessionStore.updateSessionTitle(sessionCode, updates.title);
		} else if (updates.storyPointScale && Array.isArray(updates.storyPointScale)) {
			session = await PostgresSessionStore.updateStoryPointScale(
				sessionCode,
				updates.storyPointScale
			);
		}

		if (!session) {
			return json({ error: 'Session not found or invalid update data' }, { status: 404 });
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
		console.error('[API] Error updating session:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
