import type { SessionClient } from '$lib/api/sessionClient';
import type { Participant } from '$lib/stores/session';

export interface ParticipantModeState {
	isObserver: boolean;
	isHost: boolean;
	playerName: string;
	sessionCode: string;
}

export interface ParticipantModeOptions {
	sessionCode: string;
	playerName: string;
	onStateUpdate?: (state: ParticipantModeState) => void;
	onVoteReset?: () => void;
}

/**
 * Service for managing participant/observer mode functionality
 */
export class ParticipantModeService {
	private sessionClient: SessionClient;
	private options: ParticipantModeOptions;
	private storageKey: string;

	constructor(sessionClient: SessionClient, options: ParticipantModeOptions) {
		this.sessionClient = sessionClient;
		this.options = options;
		this.storageKey = `session_${options.sessionCode}_observer_${options.playerName}`;
	}

	/**
	 * Loads observer preference from localStorage
	 */
	loadObserverPreference(): boolean {
		try {
			return localStorage.getItem(this.storageKey) === 'true';
		} catch (error) {
			console.warn('[ParticipantModeService] Failed to load observer preference:', error);
			return false;
		}
	}

	/**
	 * Saves observer preference to localStorage
	 */
	saveObserverPreference(isObserver: boolean): void {
		try {
			localStorage.setItem(this.storageKey, isObserver.toString());
		} catch (error) {
			console.warn('[ParticipantModeService] Failed to save observer preference:', error);
		}
	}

	/**
	 * Toggles between participant and observer mode
	 */
	async toggleObserverMode(currentState: ParticipantModeState): Promise<ParticipantModeState> {
		const newIsObserver = !currentState.isObserver;

		try {
			// Prepare updates for the server
			const updates: Partial<Participant> = {
				isObserver: newIsObserver
			};

			// Clear vote if becoming observer
			if (newIsObserver) {
				updates.voted = false;
				updates.vote = undefined;

				// Notify that vote should be reset in UI
				this.options.onVoteReset?.();
			}

			// Update server state
			await this.sessionClient.updateParticipant(
				this.options.sessionCode,
				this.options.playerName,
				updates
			);

			// Update local state
			const newState: ParticipantModeState = {
				...currentState,
				isObserver: newIsObserver
			};

			// Save preference and notify
			this.saveObserverPreference(newIsObserver);
			this.options.onStateUpdate?.(newState);

			console.log(
				`[ParticipantModeService] Switched to ${newIsObserver ? 'observer' : 'participant'} mode`
			);

			return newState;
		} catch (error) {
			console.error('[ParticipantModeService] Error toggling observer mode:', error);

			// Return original state (no changes on error)
			throw new Error(
				`Failed to toggle observer mode: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	/**
	 * Updates participant mode state from session data
	 */
	updateFromParticipant(
		currentState: ParticipantModeState,
		participant: Participant | undefined
	): ParticipantModeState | null {
		if (!participant) return null;

		// Check if any relevant state has changed
		const hasChanges =
			participant.isHost !== currentState.isHost ||
			participant.isObserver !== currentState.isObserver;

		if (!hasChanges) return null;

		const newState: ParticipantModeState = {
			...currentState,
			isHost: participant.isHost,
			isObserver: participant.isObserver ?? false
		};

		// Save observer preference if it changed
		if (participant.isObserver !== currentState.isObserver) {
			this.saveObserverPreference(participant.isObserver ?? false);
		}

		this.options.onStateUpdate?.(newState);

		return newState;
	}

	/**
	 * Determines if participant can vote based on observer status and connection
	 */
	static canParticipantVote(participant: Participant): boolean {
		return !participant.isObserver && (participant.isHost || participant.isConnected !== false);
	}

	/**
	 * Filters participants to only voting participants (non-observers and connected)
	 * Note: Hosts are always included regardless of connection status to maintain session control
	 */
	static getVotingParticipants(participants: Participant[]): Participant[] {
		return participants.filter((p) => !p.isObserver && (p.isHost || p.isConnected !== false));
	}

	/**
	 * Counts voting vs observing participants
	 */
	static getParticipantCounts(participants: Participant[]): {
		total: number;
		voting: number;
		observing: number;
	} {
		const total = participants.length;
		const voting = participants.filter(
			(p) => !p.isObserver && (p.isHost || p.isConnected !== false)
		).length;
		const observing = total - voting;

		return { total, voting, observing };
	}

	/**
	 * Checks if all voting participants have voted
	 */
	static allVotingParticipantsHaveVoted(participants: Participant[]): boolean {
		const votingParticipants = this.getVotingParticipants(participants);
		return votingParticipants.length > 0 && votingParticipants.every((p) => p.voted);
	}
}
