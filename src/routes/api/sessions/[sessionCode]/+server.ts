import { json } from '@sveltejs/kit';
import { ServerSessionStore } from '$lib/server/sessionStore';
import type { RequestHandler } from './$types';

// GET /api/sessions/[sessionCode] - Get session details
export const GET: RequestHandler = async ({ params }) => {
	try {
		const { sessionCode } = params;
		const session = ServerSessionStore.getSession(sessionCode);

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
		const { sessionCode } = params;
		const updates = await request.json();

		if (updates.title && typeof updates.title === 'string') {
			const session = ServerSessionStore.updateSessionTitle(sessionCode, updates.title);
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
		}

		return json({ error: 'Invalid update data' }, { status: 400 });
	} catch (error) {
		console.error('[API] Error updating session:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
