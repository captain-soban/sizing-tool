import { cleanupDatabase } from './database.js';
import { ServerSessionStore } from './sessionStore.js';
import { log } from './logger.js';

// Track last cleanup time to prevent excessive cleanup calls
let lastCleanupTime = 0;
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes between cleanups

/**
 * Performs lazy cleanup of database and session store.
 * Only runs if enough time has passed since last cleanup.
 * Safe to call frequently from API endpoints.
 */
export async function performLazyCleanup(): Promise<void> {
	const now = Date.now();

	// Skip if cleanup was run recently
	if (now - lastCleanupTime < CLEANUP_INTERVAL) {
		return;
	}

	try {
		// Update timestamp before cleanup to prevent concurrent runs
		lastCleanupTime = now;

		// Run database cleanup
		await cleanupDatabase();

		// Run in-memory session store cleanup
		ServerSessionStore.cleanup();

		log.database(`Lazy cleanup completed at ${new Date().toISOString()}`);
	} catch (error) {
		log.databaseError('Error during lazy cleanup', error);
		// Reset timestamp so cleanup can be retried
		lastCleanupTime = now - CLEANUP_INTERVAL;
	}
}

/**
 * Force cleanup regardless of time interval.
 * Use sparingly, typically for admin operations.
 */
export async function forceCleanup(): Promise<void> {
	try {
		await cleanupDatabase();
		ServerSessionStore.cleanup();
		lastCleanupTime = Date.now();
		log.database(`Force cleanup completed at ${new Date().toISOString()}`);
	} catch (error) {
		log.databaseError('Error during force cleanup', error);
		throw error;
	}
}
