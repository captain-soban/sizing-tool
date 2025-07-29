export interface AdminSessionData {
	sessionCode: string;
	title: string;
	hostName: string;
	participantCount: number;
	createdAt: string;
	lastActivity: string;
	isActive: boolean;
	participants: Array<{
		name: string;
		voted: boolean;
		vote?: string;
		isHost: boolean;
		isObserver?: boolean;
		lastSeen?: number;
		isConnected?: boolean;
	}>;
}

export interface AdminStats {
	totalSessions: number;
	activeSessions: number;
	totalParticipants: number;
}

export interface AdminSessionsResponse {
	sessions: AdminSessionData[];
	stats: AdminStats;
}

export class AdminClient {
	private baseUrl = '/api/admin';

	async getSessions(): Promise<AdminSessionsResponse> {
		const response = await fetch(`${this.baseUrl}/sessions`);

		if (!response.ok) {
			throw new Error(`Failed to fetch sessions: ${response.statusText}`);
		}

		return response.json();
	}

	async deleteSession(sessionCode: string): Promise<void> {
		const response = await fetch(`${this.baseUrl}/sessions?sessionCode=${sessionCode}`, {
			method: 'DELETE'
		});

		if (!response.ok) {
			throw new Error(`Failed to delete session: ${response.statusText}`);
		}
	}

	async terminateSession(sessionCode: string): Promise<void> {
		const response = await fetch(`${this.baseUrl}/sessions/${sessionCode}/terminate`, {
			method: 'POST'
		});

		if (!response.ok) {
			throw new Error(`Failed to terminate session: ${response.statusText}`);
		}
	}
}
