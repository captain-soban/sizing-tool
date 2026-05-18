import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ParticipantModeService } from './participantModeService';
import type { SessionClient } from '$lib/api/sessionClient';

describe('ParticipantModeService', () => {
	beforeEach(() => {
		Object.defineProperty(globalThis, 'localStorage', {
			value: {
				getItem: vi.fn(),
				setItem: vi.fn(),
				removeItem: vi.fn()
			},
			configurable: true
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('sends an explicit null vote when withdrawing to observer mode during active voting', async () => {
		const updateParticipant = vi.fn(async () => null);
		const service = new ParticipantModeService({ updateParticipant } as unknown as SessionClient, {
			sessionCode: 'ABC12345',
			playerName: 'Mary-Jane'
		});

		await service.toggleObserverMode(
			{
				isObserver: false,
				isHost: false,
				playerName: 'Mary-Jane',
				sessionCode: 'ABC12345'
			},
			{ clearVote: true }
		);

		expect(updateParticipant).toHaveBeenCalledWith(
			'ABC12345',
			'Mary-Jane',
			{ isObserver: true, voted: false, vote: null },
			true
		);
	});

	it('preserves an existing vote when switching to observer mode outside active voting', async () => {
		const updateParticipant = vi.fn(async () => null);
		const service = new ParticipantModeService({ updateParticipant } as unknown as SessionClient, {
			sessionCode: 'ABC12345',
			playerName: 'Mary-Jane'
		});

		await service.toggleObserverMode(
			{
				isObserver: false,
				isHost: false,
				playerName: 'Mary-Jane',
				sessionCode: 'ABC12345'
			},
			{ clearVote: false }
		);

		expect(updateParticipant).toHaveBeenCalledWith(
			'ABC12345',
			'Mary-Jane',
			{ isObserver: true },
			true
		);
	});

	it('does not count disconnected hosts as connected voting participants before they vote', () => {
		const participants = [
			{
				name: 'Host',
				voted: false,
				isHost: true,
				isObserver: false,
				isConnected: false
			},
			{
				name: 'Ada',
				voted: true,
				isHost: false,
				isObserver: false,
				isConnected: true
			},
			{
				name: 'Grace',
				voted: false,
				isHost: false,
				isObserver: true,
				isConnected: true
			}
		];

		expect(ParticipantModeService.getVotingParticipants(participants)).toEqual([participants[1]]);
		expect(ParticipantModeService.getParticipantCounts(participants)).toEqual({
			total: 2,
			voting: 1,
			observing: 1,
			disconnected: 1
		});
		expect(ParticipantModeService.canParticipantVote(participants[0])).toBe(false);
	});

	it('keeps disconnected participants in voting logic after they have voted', () => {
		const votedDisconnectedParticipant = {
			name: 'Ada',
			voted: true,
			vote: '5',
			isHost: false,
			isObserver: false,
			isConnected: false
		};

		expect(ParticipantModeService.canParticipantVote(votedDisconnectedParticipant)).toBe(true);
		expect(ParticipantModeService.getVotingParticipants([votedDisconnectedParticipant])).toEqual([
			votedDisconnectedParticipant
		]);
		expect(
			ParticipantModeService.allVotingParticipantsHaveVoted([votedDisconnectedParticipant])
		).toBe(true);
	});
});
