import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PostgresSessionStore } from '$lib/server/postgresSessionStore';

export const GET: RequestHandler = async () => {
	try {
		console.log('[Admin API] Fetching all sessions...');
		const allSessions = await PostgresSessionStore.getAllSessions();
		console.log('[Admin API] Found sessions:', allSessions.length);

		// Transform session data for admin view
		const adminSessions = allSessions.map((session) => {
			// Consider a session active if it has participants seen recently (within 5 minutes)
			const now = Date.now();
			const activeParticipants = session.participants.filter(
				(p) => p.lastSeen && now - p.lastSeen < 5 * 60 * 1000
			);

			return {
				sessionCode: session.sessionCode,
				title: session.title,
				hostName: session.participants.find((p) => p.isHost)?.name || 'Unknown',
				participantCount: session.participants.length,
				createdAt: session.createdAt?.toISOString() || new Date().toISOString(),
				lastActivity:
					session.lastUpdated?.toISOString() ||
					session.createdAt?.toISOString() ||
					new Date().toISOString(),
				isActive: activeParticipants.length > 0,
				participants: session.participants
			};
		});

		// Calculate statistics
		const stats = {
			totalSessions: adminSessions.length,
			activeSessions: adminSessions.filter((s) => s.isActive).length,
			totalParticipants: adminSessions.reduce((sum, s) => sum + s.participantCount, 0)
		};

		return json({
			sessions: adminSessions,
			stats
		});
	} catch (error) {
		console.error('Error fetching admin sessions:', error);
		return json({ error: 'Failed to fetch sessions' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ url }) => {
	try {
		const sessionCode = url.searchParams.get('sessionCode');

		if (!sessionCode) {
			return json({ error: 'Session code is required' }, { status: 400 });
		}

		await PostgresSessionStore.deleteSession(sessionCode);

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting session:', error);
		return json({ error: 'Failed to delete session' }, { status: 500 });
	}
};
