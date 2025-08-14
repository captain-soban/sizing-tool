import { Pool } from 'pg';
import { dev } from '$app/environment';
import { log } from './logger.js';
import './consoleCapture.js'; // Capture console logs to file

// Database connection pool
let pool: Pool;

export function getPool(): Pool {
	if (!pool) {
		pool = new Pool({
			connectionString:
				process.env.DATABASE_URL || 'postgresql://sizingtool:sizing@localhost:5432/planning_poker',
			// Development defaults for local PostgreSQL
			host: process.env.DB_HOST || 'localhost',
			port: parseInt(process.env.DB_PORT || '5432'),
			database: process.env.DB_NAME || 'planning_poker',
			user: process.env.DB_USER || 'sizingtool',
			password: process.env.DB_PASSWORD || 'sizing',
			// Production optimizations
			max: parseInt(process.env.DB_POOL_MAX || '10'),
			idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
			connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
			// SSL for production
			ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
		});

		// Log connection info
		log.database('Initializing PostgreSQL connection pool');

		// Handle pool errors
		pool.on('error', (err) => {
			log.databaseError('Unexpected error on idle client', err);
		});
	}

	return pool;
}

// Initialize database schema
export async function initDatabase() {
	const pool = getPool();

	try {
		// Create sessions table
		await pool.query(`
			CREATE TABLE IF NOT EXISTS sessions (
				session_code VARCHAR(8) PRIMARY KEY,
				title VARCHAR(255) NOT NULL DEFAULT 'Sprint Planning Session',
				voting_in_progress BOOLEAN NOT NULL DEFAULT FALSE,
				votes_revealed BOOLEAN NOT NULL DEFAULT FALSE,
				vote_average VARCHAR(10) DEFAULT '',
				final_estimate VARCHAR(10) DEFAULT '',
				current_round INTEGER NOT NULL DEFAULT 1,
				current_round_description VARCHAR(255) NOT NULL DEFAULT 'Round 1',
				story_point_scale JSONB NOT NULL DEFAULT '["0","1","2","3","5","8","?"]',
				created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
			)
		`);

		// Create participants table
		await pool.query(`
			CREATE TABLE IF NOT EXISTS participants (
				id SERIAL PRIMARY KEY,
				session_code VARCHAR(8) NOT NULL REFERENCES sessions(session_code) ON DELETE CASCADE,
				name VARCHAR(100) NOT NULL,
				user_id VARCHAR(50),
				voted BOOLEAN NOT NULL DEFAULT FALSE,
				vote VARCHAR(10),
				is_host BOOLEAN NOT NULL DEFAULT FALSE,
				is_observer BOOLEAN NOT NULL DEFAULT FALSE,
				last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				UNIQUE(session_code, name)
			)
		`);

		// Add user_id column if it doesn't exist (for existing installations)
		await pool.query(`
			ALTER TABLE participants 
			ADD COLUMN IF NOT EXISTS user_id VARCHAR(50)
		`);

		// Add current_round columns if they don't exist (for existing installations)
		await pool.query(`
			ALTER TABLE sessions 
			ADD COLUMN IF NOT EXISTS current_round INTEGER NOT NULL DEFAULT 1,
			ADD COLUMN IF NOT EXISTS current_round_description VARCHAR(255) NOT NULL DEFAULT 'Round 1'
		`);

		// Create voting_rounds table
		await pool.query(`
			CREATE TABLE IF NOT EXISTS voting_rounds (
				id SERIAL PRIMARY KEY,
				session_code VARCHAR(8) NOT NULL REFERENCES sessions(session_code) ON DELETE CASCADE,
				round_number INTEGER NOT NULL,
				description TEXT NOT NULL DEFAULT '',
				vote_average VARCHAR(10) DEFAULT '',
				final_estimate VARCHAR(10) DEFAULT '',
				created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				completed_at TIMESTAMP WITH TIME ZONE,
				UNIQUE(session_code, round_number)
			)
		`);

		// Create round_votes table to track individual votes per round
		await pool.query(`
			CREATE TABLE IF NOT EXISTS round_votes (
				id SERIAL PRIMARY KEY,
				round_id INTEGER NOT NULL REFERENCES voting_rounds(id) ON DELETE CASCADE,
				participant_name VARCHAR(100) NOT NULL,
				vote VARCHAR(10) NOT NULL,
				created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				UNIQUE(round_id, participant_name)
			)
		`);

		// Create participant_sessions table to track which sessions a participant has joined
		await pool.query(`
			CREATE TABLE IF NOT EXISTS participant_sessions (
				id SERIAL PRIMARY KEY,
				user_id VARCHAR(50) NOT NULL,
				session_code VARCHAR(8) NOT NULL REFERENCES sessions(session_code) ON DELETE CASCADE,
				participant_name VARCHAR(100) NOT NULL,
				is_host BOOLEAN NOT NULL DEFAULT FALSE,
				first_joined TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
				UNIQUE(user_id, session_code, participant_name)
			)
		`);

		// Create indexes for better performance
		await pool.query(`
			CREATE INDEX IF NOT EXISTS idx_participants_session_code ON participants(session_code);
		`);
		await pool.query(`
			CREATE INDEX IF NOT EXISTS idx_participants_last_seen ON participants(last_seen);
		`);
		await pool.query(`
			CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
		`);
		await pool.query(`
			CREATE INDEX IF NOT EXISTS idx_sessions_updated_at ON sessions(updated_at);
		`);
		await pool.query(`
			CREATE INDEX IF NOT EXISTS idx_voting_rounds_session_code ON voting_rounds(session_code);
		`);
		await pool.query(`
			CREATE INDEX IF NOT EXISTS idx_round_votes_round_id ON round_votes(round_id);
		`);
		await pool.query(`
			CREATE INDEX IF NOT EXISTS idx_participant_sessions_user_id ON participant_sessions(user_id);
		`);
		await pool.query(`
			CREATE INDEX IF NOT EXISTS idx_participant_sessions_session_code ON participant_sessions(session_code);
		`);

		// Create function to update updated_at timestamp
		await pool.query(`
			CREATE OR REPLACE FUNCTION update_updated_at_column()
			RETURNS TRIGGER AS $$
			BEGIN
				NEW.updated_at = NOW();
				RETURN NEW;
			END;
			$$ language 'plpgsql';
		`);

		// Create triggers to automatically update updated_at
		await pool.query(`
			DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
			CREATE TRIGGER update_sessions_updated_at
				BEFORE UPDATE ON sessions
				FOR EACH ROW
				EXECUTE FUNCTION update_updated_at_column();
		`);

		if (dev) {
			log.database('Schema initialized successfully');
		}
	} catch (error) {
		log.databaseError('Error initializing schema', error);
		throw error;
	}
}

// Cleanup old sessions and inactive participants
export async function cleanupDatabase() {
	const pool = getPool();

	try {
		// Remove participants inactive for more than 30 seconds (but never remove hosts)
		const inactiveParticipants = await pool.query(`
			DELETE FROM participants 
			WHERE last_seen < NOW() - INTERVAL '30 seconds'
			AND is_host = FALSE
			RETURNING session_code, name
		`);

		// Remove sessions older than 24 hours
		const oldSessions = await pool.query(`
			DELETE FROM sessions 
			WHERE updated_at < NOW() - INTERVAL '24 hours'
			RETURNING session_code
		`);

		if (dev && ((inactiveParticipants.rowCount || 0) > 0 || (oldSessions.rowCount || 0) > 0)) {
			log.database(
				`Cleanup: removed ${inactiveParticipants.rowCount || 0} inactive participants, ${oldSessions.rowCount || 0} old sessions`
			);
		}
	} catch (error) {
		log.databaseError('Error during cleanup', error);
	}
}

// Close database connection (for graceful shutdown)
export async function closeDatabase() {
	if (pool) {
		await pool.end();
		if (dev) {
			log.database('Connection pool closed');
		}
	}
}

// Initialize database on module load
if (typeof window === 'undefined') {
	// Only run on server side
	initDatabase().catch((error) => {
		log.databaseError('Failed to initialize', error);
		log.error('Please ensure PostgreSQL is running and the connection settings are correct');
		log.error('Check your .env file or create one based on .env.example');
	});

	// Note: Cleanup is now handled via lazy cleanup in API endpoints
	// instead of setInterval to work with Vercel's serverless architecture
}
