import type { SessionClient } from '$lib/api/sessionClient';
import { getRecentSessions, addRecentSession } from '$lib/stores/session';

export interface ShareableLinkResult {
	needsNamePrompt: boolean;
	sessionExists: boolean;
	sessionTitle?: string;
	playerName?: string;
	isHost?: boolean;
}

export class ShareableLinkService {
	constructor(private sessionClient: SessionClient) {}

	/**
	 * Check if user can access session via shareable link
	 */
	async checkShareableLinkAccess(sessionCode: string): Promise<ShareableLinkResult> {
		try {
			// First, check if session exists
			const sessionData = await this.sessionClient.getSession(sessionCode);

			if (!sessionData) {
				return {
					needsNamePrompt: false,
					sessionExists: false
				};
			}

			// Check if user has previously joined this session
			const recentSessions = getRecentSessions();
			const existingSession = recentSessions.find((s) => s.sessionCode === sessionCode);

			if (existingSession) {
				// User has joined before - can rejoin automatically
				return {
					needsNamePrompt: false,
					sessionExists: true,
					sessionTitle: sessionData.title,
					playerName: existingSession.playerName,
					isHost: existingSession.isHost
				};
			}

			// New user accessing shared link - needs name prompt
			return {
				needsNamePrompt: true,
				sessionExists: true,
				sessionTitle: sessionData.title
			};
		} catch (error) {
			console.error('[ShareableLinkService] Error checking access:', error);
			return {
				needsNamePrompt: false,
				sessionExists: false
			};
		}
	}

	/**
	 * Join session via shareable link
	 */
	async joinViaShareableLink(sessionCode: string, playerName: string): Promise<void> {
		try {
			// Join the session as a participant (never host via shared link)
			await this.sessionClient.joinSession(sessionCode, playerName, false);

			// Track participant in database
			await this.sessionClient.trackParticipant(sessionCode, playerName, false);

			// Get current session data to preserve the title
			const sessionData = await this.sessionClient.getSession(sessionCode);

			// Add to recent sessions for future quick access
			addRecentSession({
				sessionCode,
				playerName,
				isHost: false,
				sessionTitle: sessionData?.title
			});

			console.log(`[ShareableLinkService] Successfully joined ${sessionCode} as ${playerName}`);
		} catch (error) {
			console.error('[ShareableLinkService] Error joining via link:', error);
			throw error;
		}
	}

	/**
	 * Rejoin session for returning user
	 */
	async rejoinViaShareableLink(
		sessionCode: string,
		playerName: string,
		isHost: boolean = false
	): Promise<void> {
		try {
			// Rejoin the session
			await this.sessionClient.joinSession(sessionCode, playerName, false);

			// Get current session data to preserve the title
			const sessionData = await this.sessionClient.getSession(sessionCode);

			// Update recent session timestamp (preserve host status and title)
			addRecentSession({
				sessionCode,
				playerName,
				isHost,
				sessionTitle: sessionData?.title
			});

			console.log(`[ShareableLinkService] Successfully rejoined ${sessionCode} as ${playerName}`);
		} catch (error) {
			console.error('[ShareableLinkService] Error rejoining via link:', error);
			throw error;
		}
	}

	/**
	 * Generate shareable link URL
	 */
	static generateShareableLink(sessionCode: string, baseUrl?: string): string {
		const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
		return `${origin}/session/${sessionCode}`;
	}

	/**
	 * Copy shareable link to clipboard with user feedback
	 */
	static async copyShareableLink(sessionCode: string, buttonSelector?: string): Promise<boolean> {
		try {
			const sessionUrl = this.generateShareableLink(sessionCode);
			await navigator.clipboard.writeText(sessionUrl);

			// Visual feedback
			if (buttonSelector) {
				const button = document.querySelector(buttonSelector);
				if (button) {
					const originalTitle = button.getAttribute('title');
					button.setAttribute('title', 'Copied to clipboard!');
					setTimeout(() => {
						button.setAttribute('title', originalTitle || 'Share session');
					}, 2000);
				}
			}

			console.log(`[ShareableLinkService] Copied link: ${sessionUrl}`);
			return true;
		} catch (error) {
			console.error('[ShareableLinkService] Failed to copy link:', error);

			// Fallback for browsers that don't support clipboard API
			if (typeof window !== 'undefined') {
				window.alert(`Share this session code: ${sessionCode}`);
			}
			return false;
		}
	}
}
