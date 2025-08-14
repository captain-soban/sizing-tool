import type { Participant, VotingState } from '$lib/stores/session';

export interface ServerSession {
	sessionCode: string;
	title: string;
	participants: Participant[];
	votingState: VotingState;
	storyPointScale: string[];
	createdAt: Date;
	lastUpdated: Date;
	lastActivity?: string;
}

// In-memory storage for sessions
const sessions = new Map<string, ServerSession>();

// Cleanup old sessions after 24 hours
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

export class ServerSessionStore {
	static createSession(sessionCode: string, hostName: string): ServerSession {
		const session: ServerSession = {
			sessionCode,
			title: 'Sprint Planning Session',
			participants: [
				{
					name: hostName,
					voted: false,
					isHost: true,
					isObserver: false,
					lastSeen: Date.now()
				}
			],
			votingState: {
				votingInProgress: false,
				votesRevealed: false,
				voteAverage: '',
				finalEstimate: '',
				currentRound: 1,
				currentRoundDescription: 'Round 1',
				rounds: []
			},
			storyPointScale: ['0', '1', '2', '3', '5', '8', '?'],
			createdAt: new Date(),
			lastUpdated: new Date()
		};

		sessions.set(sessionCode, session);
		console.log(`[ServerSessionStore] Created session ${sessionCode} with host ${hostName}`);
		return session;
	}

	static getSession(sessionCode: string): ServerSession | null {
		const session = sessions.get(sessionCode);
		if (!session) {
			console.log(`[ServerSessionStore] Session ${sessionCode} not found`);
			return null;
		}

		// Clean up inactive participants (haven't been seen in 30 seconds)
		const now = Date.now();
		const activeParticipants = session.participants.filter((p) => now - (p.lastSeen || 0) < 30000);

		if (activeParticipants.length !== session.participants.length) {
			session.participants = activeParticipants;
			session.lastUpdated = new Date();
			console.log(`[ServerSessionStore] Cleaned up inactive participants in ${sessionCode}`);
		}

		return session;
	}

	static joinSession(
		sessionCode: string,
		playerName: string,
		isObserver = false
	): ServerSession | null {
		const session = this.getSession(sessionCode);
		if (!session) {
			console.log(`[ServerSessionStore] Cannot join non-existent session ${sessionCode}`);
			return null;
		}

		// Check if participant already exists
		const existingIndex = session.participants.findIndex((p) => p.name === playerName);
		const participant: Participant = {
			name: playerName,
			voted: false,
			isHost: false,
			isObserver,
			lastSeen: Date.now()
		};

		if (existingIndex >= 0) {
			// Update existing participant
			session.participants[existingIndex] = {
				...session.participants[existingIndex],
				...participant,
				isHost: session.participants[existingIndex].isHost // Preserve host status
			};
			console.log(`[ServerSessionStore] Updated participant ${playerName} in ${sessionCode}`);
		} else {
			// Add new participant
			session.participants.push(participant);
			console.log(`[ServerSessionStore] Added participant ${playerName} to ${sessionCode}`);
		}

		session.lastUpdated = new Date();
		return session;
	}

	static updateParticipant(
		sessionCode: string,
		playerName: string,
		updates: Partial<Participant>
	): ServerSession | null {
		const session = this.getSession(sessionCode);
		if (!session) return null;

		const participantIndex = session.participants.findIndex((p) => p.name === playerName);
		if (participantIndex === -1) {
			console.log(`[ServerSessionStore] Participant ${playerName} not found in ${sessionCode}`);
			return null;
		}

		session.participants[participantIndex] = {
			...session.participants[participantIndex],
			...updates,
			lastSeen: Date.now()
		};

		session.lastUpdated = new Date();
		console.log(
			`[ServerSessionStore] Updated participant ${playerName} in ${sessionCode}:`,
			updates
		);
		return session;
	}

	static updateVotingState(
		sessionCode: string,
		votingState: Partial<VotingState>
	): ServerSession | null {
		const session = this.getSession(sessionCode);
		if (!session) return null;

		session.votingState = { ...session.votingState, ...votingState };
		session.lastUpdated = new Date();
		console.log(`[ServerSessionStore] Updated voting state in ${sessionCode}:`, votingState);
		return session;
	}

	static updateSessionTitle(sessionCode: string, title: string): ServerSession | null {
		const session = this.getSession(sessionCode);
		if (!session) return null;

		session.title = title;
		session.lastUpdated = new Date();
		console.log(`[ServerSessionStore] Updated title in ${sessionCode}: ${title}`);
		return session;
	}

	static updateStoryPointScale(sessionCode: string, scale: string[]): ServerSession | null {
		const session = this.getSession(sessionCode);
		if (!session) return null;

		session.storyPointScale = scale;
		session.lastUpdated = new Date();
		console.log(`[ServerSessionStore] Updated story point scale in ${sessionCode}:`, scale);
		return session;
	}

	static resetVotes(sessionCode: string): ServerSession | null {
		const session = this.getSession(sessionCode);
		if (!session) return null;

		session.participants = session.participants.map((p) => ({
			...p,
			voted: false,
			vote: undefined,
			lastSeen: Date.now()
		}));

		session.votingState = {
			...session.votingState,
			votingInProgress: true,
			votesRevealed: false,
			voteAverage: '',
			finalEstimate: ''
		};

		session.lastUpdated = new Date();
		console.log(`[ServerSessionStore] Reset votes in ${sessionCode}`);
		return session;
	}

	static getAllSessions(): ServerSession[] {
		return Array.from(sessions.values());
	}

	static deleteSession(sessionCode: string): boolean {
		const deleted = sessions.delete(sessionCode);
		if (deleted) {
			console.log(`[ServerSessionStore] Deleted session ${sessionCode}`);
		} else {
			console.log(`[ServerSessionStore] Session ${sessionCode} not found for deletion`);
		}
		return deleted;
	}

	static cleanup(): void {
		const now = Date.now();
		const expiredSessions: string[] = [];

		sessions.forEach((session, sessionCode) => {
			if (now - session.lastUpdated.getTime() > SESSION_TIMEOUT) {
				expiredSessions.push(sessionCode);
			}
		});

		expiredSessions.forEach((sessionCode) => {
			sessions.delete(sessionCode);
			console.log(`[ServerSessionStore] Cleaned up expired session ${sessionCode}`);
		});

		if (expiredSessions.length > 0) {
			console.log(`[ServerSessionStore] Cleaned up ${expiredSessions.length} expired sessions`);
		}
	}
}

// Note: Cleanup is now handled via lazy cleanup in API endpoints
// instead of setInterval to work with Vercel's serverless architecture

// Admin interface
export interface AdminSessionStore {
	getAllSessions(): Promise<ServerSession[]>;
	deleteSession(sessionCode: string): Promise<boolean>;
	updateSession(
		sessionCode: string,
		updates: Partial<ServerSession>
	): Promise<ServerSession | null>;
	getSession(sessionCode: string): Promise<ServerSession | null>;
}

class AdminSessionStoreImpl implements AdminSessionStore {
	async getAllSessions(): Promise<ServerSession[]> {
		return ServerSessionStore.getAllSessions();
	}

	async deleteSession(sessionCode: string): Promise<boolean> {
		return ServerSessionStore.deleteSession(sessionCode);
	}

	async updateSession(
		sessionCode: string,
		updates: Partial<ServerSession>
	): Promise<ServerSession | null> {
		const session = ServerSessionStore.getSession(sessionCode);
		if (!session) return null;

		Object.assign(session, updates);
		session.lastUpdated = new Date();
		return session;
	}

	async getSession(sessionCode: string): Promise<ServerSession | null> {
		return ServerSessionStore.getSession(sessionCode);
	}
}

export function getSessionStore(): AdminSessionStore {
	return new AdminSessionStoreImpl();
}
