import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionClient } from './sessionClient';

describe('SessionClient', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => ({
				ok: true,
				json: async () => ({})
			}))
		);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('preserves hyphenated participant names when flushing batched updates', async () => {
		const client = new SessionClient();

		await client.updateParticipant('ABC12345', 'Mary-Jane', { voted: true, vote: '5' });
		await vi.advanceTimersByTimeAsync(250);

		expect(fetch).toHaveBeenCalledWith('/api/sessions/ABC12345/participants/Mary-Jane', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ voted: true, vote: '5' })
		});
	});
});
