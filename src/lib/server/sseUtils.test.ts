import { afterEach, describe, expect, it } from 'vitest';
import { getSessionConnectionStatus, participantConnections, sessionConnections } from './sseUtils';
import type { Participant } from '$lib/stores/session';

describe('getSessionConnectionStatus', () => {
	afterEach(() => {
		participantConnections.clear();
		sessionConnections.clear();
	});

	it('treats a recently seen participant as connected even without a local SSE controller', () => {
		const participant: Participant = {
			name: 'USER_A',
			voted: true,
			isHost: false,
			isObserver: false,
			lastSeen: Date.now()
		};

		const [withStatus] = getSessionConnectionStatus([participant], 'ABC12345');

		expect(withStatus.isConnected).toBe(true);
	});

	it('treats a participant with a live SSE controller as connected', () => {
		const controller = { desiredSize: 1 } as ReadableStreamDefaultController;
		participantConnections.set('ABC12345:USER_A', controller);

		const participant: Participant = {
			name: 'USER_A',
			voted: false,
			isHost: false,
			isObserver: false,
			lastSeen: Date.now() - 5 * 60 * 1000
		};

		const [withStatus] = getSessionConnectionStatus([participant], 'ABC12345');

		expect(withStatus.isConnected).toBe(true);
	});

	it('marks stale participants without SSE as disconnected', () => {
		const participant: Participant = {
			name: 'USER_A',
			voted: false,
			isHost: false,
			isObserver: false,
			lastSeen: Date.now() - 5 * 60 * 1000
		};

		const [withStatus] = getSessionConnectionStatus([participant], 'ABC12345');

		expect(withStatus.isConnected).toBe(false);
	});
});
