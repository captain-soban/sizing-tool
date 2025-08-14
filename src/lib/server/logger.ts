import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { dev } from '$app/environment';

// Define log format
const logFormat = winston.format.combine(
	winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	winston.format.errors({ stack: true }),
	winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
		const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
		const stackStr = stack ? `\n${stack}` : '';
		return `${timestamp} [${level.toUpperCase()}] ${message}${stackStr}${metaStr ? `\n${metaStr}` : ''}`;
	})
);

// Create console transport
const consoleTransport = new winston.transports.Console({
	format: dev
		? winston.format.combine(
				winston.format.colorize(),
				winston.format.simple(),
				winston.format.printf(({ timestamp, level, message }) => {
					return `${timestamp} [${level}] ${message}`;
				})
			)
		: winston.format.combine(winston.format.simple())
});

// Function to create file transports (only in development)
function createFileTransports() {
	if (!dev) return [];

	const logsDir = 'logs';

	return [
		new DailyRotateFile({
			filename: `${logsDir}/app-%DATE%.log`,
			datePattern: 'YYYY-MM-DD',
			maxSize: '20m',
			maxFiles: '14d',
			format: logFormat
		}),
		new DailyRotateFile({
			filename: `${logsDir}/error-%DATE%.log`,
			datePattern: 'YYYY-MM-DD',
			level: 'error',
			maxSize: '20m',
			maxFiles: '30d',
			format: logFormat
		})
	];
}

// Configure winston logger
const logger = winston.createLogger({
	level: dev ? 'debug' : 'info',
	format: logFormat,
	transports: [consoleTransport, ...createFileTransports()],
	// Handle uncaught exceptions and rejections (file logging only in development)
	exceptionHandlers: dev
		? [
				new DailyRotateFile({
					filename: `logs/exceptions-%DATE%.log`,
					datePattern: 'YYYY-MM-DD',
					maxSize: '20m',
					maxFiles: '30d',
					format: logFormat
				})
			]
		: [consoleTransport],
	rejectionHandlers: dev
		? [
				new DailyRotateFile({
					filename: `logs/rejections-%DATE%.log`,
					datePattern: 'YYYY-MM-DD',
					maxSize: '20m',
					maxFiles: '30d',
					format: logFormat
				})
			]
		: [consoleTransport]
});

// Create structured logging functions
export const log = {
	error: (message: string, meta?: unknown) => logger.error(message, meta),
	warn: (message: string, meta?: unknown) => logger.warn(message, meta),
	info: (message: string, meta?: unknown) => logger.info(message, meta),
	debug: (message: string, meta?: unknown) => logger.debug(message, meta),

	// Specific logging functions for different components
	database: (message: string, meta?: unknown) => logger.info(`[Database] ${message}`, meta),
	session: (message: string, meta?: unknown) => logger.info(`[Session] ${message}`, meta),
	sse: (message: string, meta?: unknown) => logger.info(`[SSE] ${message}`, meta),
	api: (message: string, meta?: unknown) => logger.info(`[API] ${message}`, meta),
	admin: (message: string, meta?: unknown) => logger.info(`[Admin] ${message}`, meta),

	// Error logging functions
	databaseError: (message: string, error?: unknown) =>
		logger.error(`[Database] ${message}`, { error }),
	sessionError: (message: string, error?: unknown) =>
		logger.error(`[Session] ${message}`, { error }),
	sseError: (message: string, error?: unknown) => logger.error(`[SSE] ${message}`, { error }),
	apiError: (message: string, error?: unknown) => logger.error(`[API] ${message}`, { error }),
	adminError: (message: string, error?: unknown) => logger.error(`[Admin] ${message}`, { error })
};

export default logger;
