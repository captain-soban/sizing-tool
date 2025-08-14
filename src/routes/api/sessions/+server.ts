import { json } from '@sveltejs/kit';
import { PostgresSessionStore } from '$lib/server/postgresSessionStore';
import { generateSessionCode } from '$lib/stores/session';
import { performLazyCleanup } from '$lib/server/lazyCleanup';
import type { RequestHandler } from './$types';

// POST /api/sessions - Create new session
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Perform lazy cleanup
		performLazyCleanup().catch((error) => {
			console.error('[API] Lazy cleanup error:', error);
		});
		const { hostName, userId, title, storyPointScale } = await request.json();

		if (!hostName || typeof hostName !== 'string') {
			return json({ error: 'Host name is required' }, { status: 400 });
		}

		if (!userId || typeof userId !== 'string') {
			return json({ error: 'User ID is required' }, { status: 400 });
		}

		// Generate unique session code
		let sessionCode: string;
		let attempts = 0;
		do {
			sessionCode = generateSessionCode();
			attempts++;
			if (attempts > 10) {
				return json({ error: 'Unable to generate unique session code' }, { status: 500 });
			}
		} while (await PostgresSessionStore.getSession(sessionCode));

		const session = await PostgresSessionStore.createSession(
			sessionCode,
			hostName,
			userId,
			title,
			storyPointScale
		);

		return json({
			sessionCode: session.sessionCode,
			title: session.title,
			participants: session.participants,
			votingState: session.votingState,
			storyPointScale: session.storyPointScale
		});
	} catch (error) {
		console.error('[API] Error creating session:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// GET /api/sessions - Get all sessions (for debugging)
export const GET: RequestHandler = async () => {
	try {
		// Perform lazy cleanup
		performLazyCleanup().catch((error) => {
			console.error('[API] Lazy cleanup error:', error);
		});
		const sessions = await PostgresSessionStore.getAllSessions();
		return json(
			sessions.map((s) => ({
				sessionCode: s.sessionCode,
				title: s.title,
				participantCount: s.participants.length,
				createdAt: s.createdAt,
				lastUpdated: s.lastUpdated
			}))
		);
	} catch (error) {
		console.error('[API] Error getting sessions:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
