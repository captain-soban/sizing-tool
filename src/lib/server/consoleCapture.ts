import fs from 'fs';
import path from 'path';
import { dev } from '$app/environment';

// Store original console methods for cleanup
const originalConsole = {
	log: console.log,
	error: console.error,
	warn: console.warn,
	info: console.info,
	debug: console.debug
};

// Only enable console capture in development mode
if (dev) {
	// Ensure logs directory exists
	const logsDir = 'logs';
	if (!fs.existsSync(logsDir)) {
		fs.mkdirSync(logsDir, { recursive: true });
	}

	// Create log file with current date
	const getLogFileName = () => {
		const date = new Date().toISOString().split('T')[0];
		return path.join(logsDir, `console-${date}.log`);
	};

	// Format log entry
	const formatLogEntry = (level: string, args: unknown[]) => {
		const timestamp = new Date().toISOString();
		const message = args
			.map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
			.join(' ');
		return `${timestamp} [${level.toUpperCase()}] ${message}\n`;
	};

	// Write to log file
	const writeToFile = (content: string) => {
		try {
			fs.appendFileSync(getLogFileName(), content);
		} catch {
			// Silently fail to avoid infinite loops
		}
	};

	// Override console methods only in development
	console.log = (...args: unknown[]) => {
		originalConsole.log(...args);
		writeToFile(formatLogEntry('info', args));
	};

	console.error = (...args: unknown[]) => {
		originalConsole.error(...args);
		writeToFile(formatLogEntry('error', args));
	};

	console.warn = (...args: unknown[]) => {
		originalConsole.warn(...args);
		writeToFile(formatLogEntry('warn', args));
	};

	console.info = (...args: unknown[]) => {
		originalConsole.info(...args);
		writeToFile(formatLogEntry('info', args));
	};

	console.debug = (...args: unknown[]) => {
		originalConsole.debug(...args);
		writeToFile(formatLogEntry('debug', args));
	};
}

// Export for cleanup if needed
export const restoreConsole = () => {
	Object.assign(console, originalConsole);
};

export default {};
