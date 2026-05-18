import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateSessionCode, generateUserId, mergeSessionsFromDatabase } from './session';
import type { RecentSession } from './session';

describe('session utilities', () => {
	beforeEach(() => {
		const storage = new Map<string, string>();

		Object.defineProperty(globalThis, 'localStorage', {
			value: {
				getItem: vi.fn((key: string) => storage.get(key) ?? null),
				setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
				removeItem: vi.fn((key: string) => storage.delete(key)),
				clear: vi.fn(() => storage.clear())
			},
			configurable: true
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('generates visually distinct 8-character session codes', () => {
		for (let i = 0; i < 100; i++) {
			const code = generateSessionCode();

			expect(code).toMatch(/^[1-9A-NP-Z]{8}$/);
			expect(code).not.toContain('0');
			expect(code).not.toContain('O');
		}
	});

	it('generates user ids with the expected prefix', () => {
		vi.spyOn(Date, 'now').mockReturnValue(1234567890);
		vi.spyOn(Math, 'random').mockReturnValue(0.5);

		expect(generateUserId()).toMatch(/^user_1234567890_[a-z0-9]+$/);
	});

	it('merges database sessions ahead of stale local sessions when force syncing', () => {
		const databaseSessions: RecentSession[] = [
			{
				sessionCode: 'ABC12345',
				playerName: 'Ada',
				sessionTitle: 'Sprint Planning',
				isHost: true,
				lastAccessed: 2000,
				userId: 'user-1'
			}
		];

		localStorage.setItem(
			'recentSessions',
			JSON.stringify([
				{
					sessionCode: 'STALE123',
					playerName: 'Grace',
					sessionTitle: 'Deleted Session',
					isHost: false,
					lastAccessed: 3000,
					userId: 'user-1'
				}
			])
		);

		expect(mergeSessionsFromDatabase(databaseSessions, true)).toEqual(databaseSessions);
	});
});
