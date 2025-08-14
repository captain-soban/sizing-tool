import type { Participant, VotingState, VotingRound, RecentSession } from '$lib/stores/session';
import { getUserId } from '$lib/stores/session';

export interface SessionData {
	sessionCode: string;
	title: string;
	participants: Participant[];
	votingState: VotingState;
	storyPointScale: string[];
	lastUpdated: string;
}

export class SessionClient {
	private eventSource: EventSource | null = null;
	private updateCallbacks: ((session: SessionData) => void)[] = [];

	// Create new session
	async createSession(
		hostName: string,
		title?: string,
		storyPointScale?: string[]
	): Promise<SessionData> {
		const userId = getUserId();
		const response = await fetch('/api/sessions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ hostName, userId, title, storyPointScale })
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to create session');
		}

		return response.json();
	}

	// Join existing session
	async joinSession(
		sessionCode: string,
		playerName: string,
		isObserver = false
	): Promise<SessionData> {
		const userId = getUserId();
		const response = await fetch(`/api/sessions/${sessionCode}/join`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ playerName, userId, isObserver })
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to join session');
		}

		return response.json();
	}

	// Get session details
	async getSession(sessionCode: string): Promise<SessionData> {
		const response = await fetch(`/api/sessions/${sessionCode}`);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to get session');
		}

		return response.json();
	}

	// Update participant (vote, observer status, etc.)
	async updateParticipant(
		sessionCode: string,
		playerName: string,
		updates: Partial<Participant>
	): Promise<SessionData> {
		const response = await fetch(
			`/api/sessions/${sessionCode}/participants/${encodeURIComponent(playerName)}`,
			{
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates)
			}
		);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to update participant');
		}

		return response.json();
	}

	// Remove participant from session (host only)
	async removeParticipant(sessionCode: string, playerName: string): Promise<SessionData> {
		const response = await fetch(
			`/api/sessions/${sessionCode}/participants/${encodeURIComponent(playerName)}`,
			{
				method: 'DELETE'
			}
		);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to remove participant');
		}

		return response.json();
	}

	// Update voting state
	async updateVotingState(
		sessionCode: string,
		votingState: Partial<VotingState>
	): Promise<SessionData> {
		const response = await fetch(`/api/sessions/${sessionCode}/voting`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(votingState)
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to update voting state');
		}

		return response.json();
	}

	// Reset votes and start new voting round
	async resetVotes(sessionCode: string): Promise<SessionData> {
		const response = await fetch(`/api/sessions/${sessionCode}/voting/reset`, {
			method: 'POST'
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to reset votes');
		}

		return response.json();
	}

	// Update session title
	async updateSessionTitle(sessionCode: string, title: string): Promise<SessionData> {
		const response = await fetch(`/api/sessions/${sessionCode}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title })
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to update session title');
		}

		return response.json();
	}

	// Update story point scale
	async updateStoryPointScale(
		sessionCode: string,
		storyPointScale: string[]
	): Promise<SessionData> {
		const response = await fetch(`/api/sessions/${sessionCode}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ storyPointScale })
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to update story point scale');
		}

		return response.json();
	}

	// Connect to Server-Sent Events for real-time updates
	connectToRealtime(sessionCode: string): void {
		this.disconnect(); // Clean up any existing connection

		console.log(`[SessionClient] Connecting to SSE for session ${sessionCode}`);
		this.eventSource = new EventSource(`/api/sessions/${sessionCode}/events`);

		this.eventSource.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);

				if (data.type === 'session-update') {
					console.log(`[SessionClient] Received session update:`, data);
					this.updateCallbacks.forEach((callback) => callback(data));
				} else if (data.type === 'heartbeat') {
					console.log(`[SessionClient] Received heartbeat`);
				}
			} catch (error) {
				console.error('[SessionClient] Error parsing SSE message:', error);
			}
		};

		this.eventSource.onerror = (error) => {
			console.error('[SessionClient] SSE connection error:', error);
		};

		this.eventSource.onopen = () => {
			console.log(`[SessionClient] SSE connection opened`);
		};
	}

	// Add callback for session updates
	onUpdate(callback: (session: SessionData) => void): void {
		this.updateCallbacks.push(callback);
	}

	// Remove callback
	removeUpdateCallback(callback: (session: SessionData) => void): void {
		const index = this.updateCallbacks.indexOf(callback);
		if (index > -1) {
			this.updateCallbacks.splice(index, 1);
		}
	}

	// Disconnect from real-time updates
	disconnect(): void {
		if (this.eventSource) {
			console.log(`[SessionClient] Disconnecting from SSE`);
			this.eventSource.close();
			this.eventSource = null;
		}
	}

	// Send heartbeat to keep participant active
	async sendHeartbeat(sessionCode: string, playerName: string): Promise<void> {
		try {
			await this.updateParticipant(sessionCode, playerName, { lastSeen: Date.now() });
		} catch (error) {
			console.error('[SessionClient] Failed to send heartbeat:', error);
		}
	}

	// Get voting rounds for a session
	async getRounds(sessionCode: string): Promise<VotingRound[]> {
		const response = await fetch(`/api/sessions/${sessionCode}/rounds`);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to get rounds');
		}

		const data = await response.json();
		return data.rounds;
	}

	// Save a voting round
	async saveRound(
		sessionCode: string,
		roundNumber: number,
		description: string,
		votes: { [participantName: string]: string },
		voteAverage: string,
		finalEstimate: string
	): Promise<void> {
		const response = await fetch(`/api/sessions/${sessionCode}/rounds`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				roundNumber,
				description,
				votes,
				voteAverage,
				finalEstimate
			})
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to save round');
		}
	}

	// Track participant joining session
	async trackParticipant(sessionCode: string, playerName: string, isHost: boolean): Promise<void> {
		const userId = getUserId();
		const response = await fetch(
			`/api/sessions/${sessionCode}/participants/${encodeURIComponent(playerName)}/track`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, isHost })
			}
		);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to track participant');
		}
	}

	// Get user's recent sessions from database
	async getUserSessions(userId?: string): Promise<RecentSession[]> {
		const userIdToUse = userId || getUserId();
		const response = await fetch(`/api/sessions/user/${encodeURIComponent(userIdToUse)}`);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to get user sessions');
		}

		const data = await response.json();
		return data.sessions;
	}
}
