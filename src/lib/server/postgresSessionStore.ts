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
	static async createSession(sessionCode: string, hostName: string): Promise<ServerSession> {
		const pool = getPool();

		try {
			await pool.query('BEGIN');

			// Create session
			await pool.query(`INSERT INTO sessions (session_code, title) VALUES ($1, $2)`, [
				sessionCode,
				'Sprint Planning Session'
			]);

			// Add host participant
			await pool.query(
				`INSERT INTO participants (session_code, name, is_host, last_seen) 
				 VALUES ($1, $2, $3, NOW())`,
				[sessionCode, hostName, true]
			);

			await pool.query('COMMIT');

			console.log(`[PostgresSessionStore] Created session ${sessionCode} with host ${hostName}`);

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
				`SELECT name, voted, vote, is_host, is_observer, 
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
				lastSeen: row.last_seen
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

			// Insert or update participant
			await pool.query(
				`INSERT INTO participants (session_code, name, is_observer, last_seen)
				 VALUES ($1, $2, $3, NOW())
				 ON CONFLICT (session_code, name)
				 DO UPDATE SET is_observer = $3, last_seen = NOW()`,
				[sessionCode, playerName, isObserver]
			);

			console.log(`[PostgresSessionStore] Player ${playerName} joined session ${sessionCode}`);

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
			const result = await pool.query(`
				SELECT session_code, title, created_at, updated_at,
					   COUNT(p.name) as participant_count
				FROM sessions s
				LEFT JOIN participants p ON s.session_code = p.session_code
				GROUP BY s.session_code, s.title, s.created_at, s.updated_at
				ORDER BY s.updated_at DESC
			`);

			return result.rows.map((row) => ({
				sessionCode: row.session_code,
				title: row.title,
				participants: [], // Not loading full participant data for list view
				votingState: {
					votingInProgress: false,
					votesRevealed: false,
					voteAverage: '',
					finalEstimate: ''
				},
				storyPointScale: [],
				createdAt: row.created_at,
				lastUpdated: row.updated_at
			}));
		} catch (error) {
			console.error('[PostgresSessionStore] Error getting all sessions:', error);
			return [];
		}
	}
}
