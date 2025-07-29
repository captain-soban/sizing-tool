export interface Participant {
	name: string;
	voted: boolean;
	vote?: string;
	isHost: boolean;
	isObserver?: boolean;
	lastSeen?: number;
}

export interface SessionState {
	sessionCode: string;
	sessionTitle: string;
	participants: Participant[];
	votingInProgress: boolean;
	votesRevealed: boolean;
	voteAverage: string;
	finalEstimate: string;
	storyPointScale: string[];
}

export interface VotingState {
	votingInProgress: boolean;
	votesRevealed: boolean;
	voteAverage: string;
	finalEstimate: string;
}

export interface RecentSession {
	sessionCode: string;
	playerName: string;
	sessionTitle?: string;
	isHost: boolean;
	lastAccessed: number;
}

export const defaultStoryPointScales = {
	fibonacci_0_8: ['0', '1', '2', '3', '5', '8', '?'],
	fibonacci_1_8: ['1', '2', '3', '5', '8', '?'],
	fibonacci_0_13: ['0', '1', '2', '3', '5', '8', '13', '?'],
	tshirt: ['XS', 'S', 'M', 'L', 'XL', '?'],
	linear: ['1', '2', '3', '4', '5', '6', '7', '8', '?']
};

export function createLocalStore<T>(key: string, initialValue: T) {
	let storedValue: T;

	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem(key);
		storedValue = stored ? JSON.parse(stored) : initialValue;
	} else {
		storedValue = initialValue;
	}

	let value = $state(storedValue);

	$effect(() => {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(key, JSON.stringify(value));
		}
	});

	return {
		get value() {
			return value;
		},
		set value(newValue: T) {
			value = newValue;
		}
	};
}

export function generateSessionCode(): string {
	const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
	let code = '';
	for (let i = 0; i < 8; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return code;
}

// Recent sessions management
const RECENT_SESSIONS_KEY = 'recentSessions';
const MAX_RECENT_SESSIONS = 10;

export function getRecentSessions(): RecentSession[] {
	if (typeof localStorage === 'undefined') return [];

	const stored = localStorage.getItem(RECENT_SESSIONS_KEY);
	if (!stored) return [];

	try {
		const sessions: RecentSession[] = JSON.parse(stored);
		// Sort by last accessed, most recent first
		return sessions.sort((a, b) => b.lastAccessed - a.lastAccessed);
	} catch {
		return [];
	}
}

export function addRecentSession(sessionData: Omit<RecentSession, 'lastAccessed'>): void {
	if (typeof localStorage === 'undefined') return;

	const recentSessions = getRecentSessions();
	const existingIndex = recentSessions.findIndex(
		(s) => s.sessionCode === sessionData.sessionCode && s.playerName === sessionData.playerName
	);

	const sessionWithTimestamp: RecentSession = {
		...sessionData,
		lastAccessed: Date.now()
	};

	if (existingIndex >= 0) {
		// Update existing session
		recentSessions[existingIndex] = sessionWithTimestamp;
	} else {
		// Add new session at the beginning
		recentSessions.unshift(sessionWithTimestamp);
	}

	// Limit to MAX_RECENT_SESSIONS
	const limitedSessions = recentSessions.slice(0, MAX_RECENT_SESSIONS);

	localStorage.setItem(RECENT_SESSIONS_KEY, JSON.stringify(limitedSessions));
}

export function removeRecentSession(sessionCode: string, playerName: string): void {
	if (typeof localStorage === 'undefined') return;

	const recentSessions = getRecentSessions();
	const filtered = recentSessions.filter(
		(s) => !(s.sessionCode === sessionCode && s.playerName === playerName)
	);

	localStorage.setItem(RECENT_SESSIONS_KEY, JSON.stringify(filtered));
}

export function clearRecentSessions(): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem(RECENT_SESSIONS_KEY);
}

export function updateRecentSessionTitle(
	sessionCode: string,
	playerName: string,
	title: string
): void {
	if (typeof localStorage === 'undefined') return;

	const recentSessions = getRecentSessions();
	const sessionIndex = recentSessions.findIndex(
		(s) => s.sessionCode === sessionCode && s.playerName === playerName
	);

	if (sessionIndex >= 0) {
		recentSessions[sessionIndex].sessionTitle = title;
		localStorage.setItem(RECENT_SESSIONS_KEY, JSON.stringify(recentSessions));
	}
}

// Migration utility to convert old localStorage format to new recent sessions format
export function migrateOldSessionData(): void {
	if (typeof localStorage === 'undefined') return;

	const sessionCode = localStorage.getItem('sessionCode');
	const playerName = localStorage.getItem('playerName');
	const isHost = localStorage.getItem('isHost') === 'true';

	if (sessionCode && playerName) {
		// Check if we already have recent sessions data
		const existingSessions = getRecentSessions();
		const hasExisting = existingSessions.some(
			(s) => s.sessionCode === sessionCode && s.playerName === playerName
		);

		if (!hasExisting) {
			// Add the old session data to recent sessions
			addRecentSession({
				sessionCode,
				playerName,
				isHost,
				sessionTitle: undefined
			});
		}

		// Clean up old format
		localStorage.removeItem('sessionCode');
		localStorage.removeItem('playerName');
		localStorage.removeItem('isHost');
	}
}

// Shared session management for multi-user functionality
export class SharedSessionStore {
	private sessionCode: string;
	private playerName: string;
	private updateCallbacks: (() => void)[] = [];
	private pollInterval: number | null = null;

	constructor(sessionCode: string, playerName: string) {
		this.sessionCode = sessionCode;
		this.playerName = playerName;
		this.startPolling();
		this.setupStorageListener();
	}

	// Listen for storage events from other tabs/windows
	private setupStorageListener() {
		window.addEventListener('storage', (e) => {
			if (e.key?.startsWith(`session_${this.sessionCode}_`)) {
				this.notifyCallbacks();
			}
		});
	}

	// Start periodic polling for updates
	private startPolling() {
		this.pollInterval = window.setInterval(() => {
			this.notifyCallbacks();
		}, 2000); // Poll every 2 seconds
	}

	// Stop polling when component is destroyed
	destroy() {
		if (this.pollInterval) {
			clearInterval(this.pollInterval);
		}
	}

	// Add callback for when session data changes
	onUpdate(callback: () => void) {
		this.updateCallbacks.push(callback);
	}

	// Notify all callbacks of updates
	private notifyCallbacks() {
		this.updateCallbacks.forEach((callback) => callback());
	}

	// Get shared participants list
	getParticipants(): Participant[] {
		const key = `session_${this.sessionCode}_shared_participants`;
		const stored = localStorage.getItem(key);
		return stored ? JSON.parse(stored) : [];
	}

	// Update shared participants list
	updateParticipants(participants: Participant[]) {
		localStorage.setItem(
			`session_${this.sessionCode}_shared_participants`,
			JSON.stringify(participants)
		);
		// Trigger storage event for other tabs
		window.dispatchEvent(
			new StorageEvent('storage', {
				key: `session_${this.sessionCode}_shared_participants`,
				newValue: JSON.stringify(participants)
			})
		);
	}

	// Add current player to session
	joinSession(isHost: boolean, isObserver: boolean = false) {
		const participants = this.getParticipants();
		const existingIndex = participants.findIndex((p) => p.name === this.playerName);

		const participant: Participant = {
			name: this.playerName,
			voted: false,
			isHost,
			isObserver,
			lastSeen: Date.now()
		};

		if (existingIndex >= 0) {
			participants[existingIndex] = participant;
		} else {
			participants.push(participant);
		}

		this.updateParticipants(participants);
	}

	// Remove inactive participants (haven't been seen in 30 seconds)
	cleanupInactiveParticipants() {
		const participants = this.getParticipants();
		const now = Date.now();
		const activeParticipants = participants.filter(
			(p) =>
				p.name === this.playerName || // Always keep current player
				(p.lastSeen && now - p.lastSeen < 30000) // Keep participants seen in last 30 seconds
		);

		if (activeParticipants.length !== participants.length) {
			this.updateParticipants(activeParticipants);
		}
	}

	// Update participant status (vote, observer mode, etc.)
	updateParticipantStatus(updates: Partial<Participant>) {
		const participants = this.getParticipants();
		const index = participants.findIndex((p) => p.name === this.playerName);

		if (index >= 0) {
			participants[index] = {
				...participants[index],
				...updates,
				lastSeen: Date.now()
			};
			this.updateParticipants(participants);
		}
	}

	// Get shared voting state
	getVotingState(): VotingState {
		const stored = localStorage.getItem(`session_${this.sessionCode}_shared_voting`);
		return stored
			? JSON.parse(stored)
			: {
					votingInProgress: false,
					votesRevealed: false,
					voteAverage: '',
					finalEstimate: ''
				};
	}

	// Update shared voting state
	updateVotingState(state: VotingState) {
		localStorage.setItem(`session_${this.sessionCode}_shared_voting`, JSON.stringify(state));
		window.dispatchEvent(
			new StorageEvent('storage', {
				key: `session_${this.sessionCode}_shared_voting`,
				newValue: JSON.stringify(state)
			})
		);
	}

	// Send heartbeat to indicate this participant is still active
	sendHeartbeat() {
		this.updateParticipantStatus({ lastSeen: Date.now() });
	}
}
