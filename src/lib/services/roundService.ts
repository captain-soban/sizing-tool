import type { SessionClient } from '$lib/api/sessionClient';
import type { VotingRound, Participant } from '$lib/stores/session';

export interface RoundData {
	roundNumber: number;
	description: string;
	votes: { [participantName: string]: string };
	voteAverage: string;
	finalEstimate: string;
}

export class RoundService {
	constructor(private sessionClient: SessionClient) {}

	/**
	 * Completes the current round by saving it to database and local state
	 */
	async completeCurrentRound(
		sessionCode: string,
		currentRound: number,
		currentRoundDescription: string,
		participants: Participant[],
		voteAverage: string,
		finalEstimate: string
	): Promise<VotingRound> {
		// Collect votes from current participants
		const votes: { [key: string]: string } = {};
		participants.forEach((p) => {
			if (p.vote) {
				votes[p.name] = p.vote;
			}
		});

		// Save to database
		await this.sessionClient.saveRound(
			sessionCode,
			currentRound,
			currentRoundDescription,
			votes,
			voteAverage,
			finalEstimate
		);

		// Return round data for local state
		return {
			roundNumber: currentRound,
			description: currentRoundDescription,
			votes,
			voteAverage,
			finalEstimate,
			timestamp: Date.now()
		};
	}

	/**
	 * Starts a new voting round
	 */
	async startNewRound(
		sessionCode: string,
		newRoundNumber: number,
		description: string
	): Promise<void> {
		// Reset votes and start new round
		await this.sessionClient.resetVotes(sessionCode);

		// Update current round info for all participants
		await this.sessionClient.updateVotingState(sessionCode, {
			currentRound: newRoundNumber,
			currentRoundDescription: description
		});
	}

	/**
	 * Complete current round and start new one in a single transaction-like operation
	 */
	async transitionToNewRound(
		sessionCode: string,
		currentRound: number,
		currentRoundDescription: string,
		participants: Participant[],
		voteAverage: string,
		finalEstimate: string,
		newRoundDescription: string
	): Promise<{
		completedRound: VotingRound;
		newRoundNumber: number;
	}> {
		// Complete current round
		const completedRound = await this.completeCurrentRound(
			sessionCode,
			currentRound,
			currentRoundDescription,
			participants,
			voteAverage,
			finalEstimate
		);

		// Start new round
		const newRoundNumber = currentRound + 1;
		await this.startNewRound(sessionCode, newRoundNumber, newRoundDescription);

		return {
			completedRound,
			newRoundNumber
		};
	}
}
