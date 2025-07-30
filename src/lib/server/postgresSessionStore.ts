import { getPool } from './database';
import type { Participant, VotingState } from '$lib/stores/session';

export interface ServerSession {
	sessionCode: string;
	title: string;
	participants: Participant[];
	votingState: VotingState;
	storyPointScale: string[];
	createdAt: Date;
	lastUpdated: Date;
}

export class PostgresSessionStore {
	static async createSession(
		sessionCode: string, 
		hostName: string, 
		userId: string, 
		title?: string, 
		storyPointScale?: string[]
	): Promise<ServerSession> {
		const pool = getPool();

		try {
			await pool.query('BEGIN');

			// Create session with provided title and scale
			const sessionTitle = title || 'Sprint Planning Session';
			const scale = storyPointScale || ['0', '1', '2', '3', '5', '8', '?'];
			
			await pool.query(
				`INSERT INTO sessions (session_code, title, story_point_scale) VALUES ($1, $2, $3)`, 
				[sessionCode, sessionTitle, JSON.stringify(scale)]
			);

			// Add host participant
			await pool.query(
				`INSERT INTO participants (session_code, name, user_id, is_host, last_seen) 
				 VALUES ($1, $2, $3, $4, NOW())`,
				[sessionCode, hostName, userId, true]
			);

			await pool.query('COMMIT');

			console.log(`[PostgresSessionStore] Created session ${sessionCode} with host ${hostName} (userId: ${userId})`);

			// Return the created session
			return (await this.getSession(sessionCode)) as ServerSession;
		} catch (error) {
			await pool.query('ROLLBACK');
			console.error(`[PostgresSessionStore] Error creating session:`, error);
			throw error;
		}
	}

	static async getSession(sessionCode: string): Promise<ServerSession | null> {
		const pool = getPool();

		try {
			// Get session data
			const sessionResult = await pool.query(
				`SELECT session_code, title, voting_in_progress, votes_revealed, 
						vote_average, final_estimate, story_point_scale, created_at, updated_at
				 FROM sessions WHERE session_code = $1`,
				[sessionCode]
			);

			if (sessionResult.rows.length === 0) {
				return null;
			}

			const sessionRow = sessionResult.rows[0];

			// Get participants
			const participantsResult = await pool.query(
				`SELECT name, user_id, voted, vote, is_host, is_observer, 
						EXTRACT(EPOCH FROM last_seen) * 1000 as last_seen
				 FROM participants 
				 WHERE session_code = $1 
				 ORDER BY created_at ASC`,
				[sessionCode]
			);

			const participants: Participant[] = participantsResult.rows.map((row) => ({
				name: row.name,
				voted: row.voted,
				vote: row.vote,
				isHost: row.is_host,
				isObserver: row.is_observer,
				lastSeen: row.last_seen,
				userId: row.user_id
			}));

			const session: ServerSession = {
				sessionCode: sessionRow.session_code,
				title: sessionRow.title,
				participants,
				votingState: {
					votingInProgress: sessionRow.voting_in_progress,
					votesRevealed: sessionRow.votes_revealed,
					voteAverage: sessionRow.vote_average || '',
					finalEstimate: sessionRow.final_estimate || ''
				},
				storyPointScale: sessionRow.story_point_scale,
				createdAt: sessionRow.created_at,
				lastUpdated: sessionRow.updated_at
			};

			return session;
		} catch (error) {
			console.error(`[PostgresSessionStore] Error getting session ${sessionCode}:`, error);
			return null;
		}
	}

	static async joinSession(
		sessionCode: string,
		playerName: string,
		userId: string,
		isObserver = false
	): Promise<ServerSession | null> {
		const pool = getPool();

		try {
			// Check if session exists
			const sessionExists = await pool.query('SELECT 1 FROM sessions WHERE session_code = $1', [
				sessionCode
			]);

			if (sessionExists.rows.length === 0) {
				console.log(`[PostgresSessionStore] Cannot join non-existent session ${sessionCode}`);
				return null;
			}

			// Check if this user is already the host of this session
			const existingHost = await pool.query(
				`SELECT is_host FROM participants 
				 WHERE session_code = $1 AND user_id = $2 AND is_host = true`,
				[sessionCode, userId]
			);

			const shouldBeHost = existingHost.rows.length > 0;

			// Insert or update participant
			await pool.query(
				`INSERT INTO participants (session_code, name, user_id, is_host, is_observer, last_seen)
				 VALUES ($1, $2, $3, $4, $5, NOW())
				 ON CONFLICT (session_code, name)
				 DO UPDATE SET user_id = $3, is_host = $4, is_observer = $5, last_seen = NOW()`,
				[sessionCode, playerName, userId, shouldBeHost, isObserver]
			);

			console.log(`[PostgresSessionStore] Player ${playerName} joined session ${sessionCode} (userId: ${userId}, host: ${shouldBeHost})`);

			return await this.getSession(sessionCode);
		} catch (error) {
			console.error(`[PostgresSessionStore] Error joining session:`, error);
			return null;
		}
	}

	static async updateParticipant(
		sessionCode: string,
		playerName: string,
		updates: Partial<Participant>
	): Promise<ServerSession | null> {
		const pool = getPool();

		try {
			const setClauses: string[] = [];
			const values: (boolean | string | number)[] = [];
			let paramCount = 1;

			// Build dynamic update query
			if (updates.voted !== undefined) {
				setClauses.push(`voted = $${paramCount++}`);
				values.push(updates.voted);
			}
			if (updates.vote !== undefined) {
				setClauses.push(`vote = $${paramCount++}`);
				values.push(updates.vote);
			}
			if (updates.isObserver !== undefined) {
				setClauses.push(`is_observer = $${paramCount++}`);
				values.push(updates.isObserver);
			}
			if (updates.lastSeen !== undefined) {
				setClauses.push(`last_seen = to_timestamp($${paramCount++} / 1000.0)`);
				values.push(updates.lastSeen);
			} else {
				setClauses.push(`last_seen = NOW()`);
			}

			if (setClauses.length === 0) {
				return await this.getSession(sessionCode);
			}

			// Add WHERE clause parameters
			values.push(sessionCode, playerName);
			const whereParams = `$${paramCount++}, $${paramCount++}`;

			const updateQuery = `
				UPDATE participants 
				SET ${setClauses.join(', ')}
				WHERE session_code = ${whereParams.split(',')[0]} AND name = ${whereParams.split(',')[1]}
			`;

			const result = await pool.query(updateQuery, values);

			if (result.rowCount === 0) {
				console.log(`[PostgresSessionStore] Participant ${playerName} not found in ${sessionCode}`);
				return null;
			}

			console.log(
				`[PostgresSessionStore] Updated participant ${playerName} in ${sessionCode}:`,
				updates
			);

			return await this.getSession(sessionCode);
		} catch (error) {
			console.error(`[PostgresSessionStore] Error updating participant:`, error);
			return null;
		}
	}

	static async updateVotingState(
		sessionCode: string,
		votingState: Partial<VotingState>
	): Promise<ServerSession | null> {
		const pool = getPool();

		try {
			const setClauses: string[] = [];
			const values: (boolean | string)[] = [];
			let paramCount = 1;

			// Build dynamic update query
			if (votingState.votingInProgress !== undefined) {
				setClauses.push(`voting_in_progress = $${paramCount++}`);
				values.push(votingState.votingInProgress);
			}
			if (votingState.votesRevealed !== undefined) {
				setClauses.push(`votes_revealed = $${paramCount++}`);
				values.push(votingState.votesRevealed);
			}
			if (votingState.voteAverage !== undefined) {
				setClauses.push(`vote_average = $${paramCount++}`);
				values.push(votingState.voteAverage);
			}
			if (votingState.finalEstimate !== undefined) {
				setClauses.push(`final_estimate = $${paramCount++}`);
				values.push(votingState.finalEstimate);
			}

			if (setClauses.length === 0) {
				return await this.getSession(sessionCode);
			}

			values.push(sessionCode);
			const updateQuery = `
				UPDATE sessions 
				SET ${setClauses.join(', ')}
				WHERE session_code = $${paramCount}
			`;

			await pool.query(updateQuery, values);

			console.log(`[PostgresSessionStore] Updated voting state in ${sessionCode}:`, votingState);

			return await this.getSession(sessionCode);
		} catch (error) {
			console.error(`[PostgresSessionStore] Error updating voting state:`, error);
			return null;
		}
	}

	static async updateSessionTitle(
		sessionCode: string,
		title: string
	): Promise<ServerSession | null> {
		const pool = getPool();

		try {
			await pool.query('UPDATE sessions SET title = $1 WHERE session_code = $2', [
				title,
				sessionCode
			]);

			console.log(`[PostgresSessionStore] Updated title in ${sessionCode}: ${title}`);

			return await this.getSession(sessionCode);
		} catch (error) {
			console.error(`[PostgresSessionStore] Error updating session title:`, error);
			return null;
		}
	}

	static async resetVotes(sessionCode: string): Promise<ServerSession | null> {
		const pool = getPool();

		try {
			await pool.query('BEGIN');

			// Reset all participant votes
			await pool.query(
				`UPDATE participants 
				 SET voted = FALSE, vote = NULL, last_seen = NOW()
				 WHERE session_code = $1`,
				[sessionCode]
			);

			// Update voting state
			await pool.query(
				`UPDATE sessions 
				 SET voting_in_progress = TRUE, votes_revealed = FALSE, 
					 vote_average = '', final_estimate = ''
				 WHERE session_code = $1`,
				[sessionCode]
			);

			await pool.query('COMMIT');

			console.log(`[PostgresSessionStore] Reset votes in ${sessionCode}`);

			return await this.getSession(sessionCode);
		} catch (error) {
			await pool.query('ROLLBACK');
			console.error(`[PostgresSessionStore] Error resetting votes:`, error);
			return null;
		}
	}

	static async getAllSessions(): Promise<ServerSession[]> {
		const pool = getPool();

		try {
			// Get all sessions with their basic info
			const sessionsResult = await pool.query(`
				SELECT s.session_code, s.title, s.created_at, s.updated_at,
					   s.voting_in_progress, s.votes_revealed, s.vote_average, s.final_estimate,
					   s.story_point_scale
				FROM sessions s
				ORDER BY s.updated_at DESC
			`);

			const sessions: ServerSession[] = [];

			for (const sessionRow of sessionsResult.rows) {
				// Get participants for each session (including those that might be inactive)
				const participantsResult = await pool.query(
					`
					SELECT name, voted, vote, is_host, is_observer, 
						   EXTRACT(EPOCH FROM last_seen) * 1000 as last_seen
					FROM participants 
					WHERE session_code = $1
					ORDER BY is_host DESC, name ASC
				`,
					[sessionRow.session_code]
				);

				const session: ServerSession = {
					sessionCode: sessionRow.session_code,
					title: sessionRow.title,
					participants: participantsResult.rows.map((p) => ({
						name: p.name,
						voted: p.voted,
						vote: p.vote,
						isHost: p.is_host,
						isObserver: p.is_observer,
						lastSeen: parseFloat(p.last_seen)
					})),
					votingState: {
						votingInProgress: sessionRow.voting_in_progress,
						votesRevealed: sessionRow.votes_revealed,
						voteAverage: sessionRow.vote_average || '',
						finalEstimate: sessionRow.final_estimate || ''
					},
					storyPointScale: sessionRow.story_point_scale || ['0', '1', '2', '3', '5', '8', '?'],
					createdAt: sessionRow.created_at,
					lastUpdated: sessionRow.updated_at
				};

				sessions.push(session);
			}

			console.log(`[PostgresSessionStore] Retrieved ${sessions.length} sessions for admin`);
			return sessions;
		} catch (error) {
			console.error('[PostgresSessionStore] Error getting all sessions:', error);
			return [];
		}
	}

	static async deleteSession(sessionCode: string): Promise<boolean> {
		const pool = getPool();

		try {
			await pool.query('BEGIN');

			// Delete participants first (foreign key constraint)
			await pool.query('DELETE FROM participants WHERE session_code = $1', [sessionCode]);

			// Delete session
			const result = await pool.query('DELETE FROM sessions WHERE session_code = $1', [
				sessionCode
			]);

			await pool.query('COMMIT');

			const deleted = (result.rowCount ?? 0) > 0;
			if (deleted) {
				console.log(`[PostgresSessionStore] Deleted session ${sessionCode}`);
			} else {
				console.log(`[PostgresSessionStore] Session ${sessionCode} not found for deletion`);
			}

			return deleted;
		} catch (error) {
			await pool.query('ROLLBACK');
			console.error(`[PostgresSessionStore] Error deleting session ${sessionCode}:`, error);
			return false;
		}
	}
}
