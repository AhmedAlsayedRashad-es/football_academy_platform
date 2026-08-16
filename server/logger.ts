/**
 * Structured logger — replaces raw console.log in production.
 * In development: colorized output to stdout.
 * In production: JSON-structured output for log aggregation.
 */
const isDev = process.env.NODE_ENV !== 'production';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (isDev) {
    const colors: Record<LogLevel, string> = {
      info: '\x1b[36m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      debug: '\x1b[90m',
    };
    const reset = '\x1b[0m';
    const ts = new Date().toISOString();
    const metaStr = meta ? ' ' + JSON.stringify(meta) : '';
    process.stdout.write(`${colors[level]}[${level.toUpperCase()}]${reset} ${ts} ${message}${metaStr}\n`);
  } else {
    process.stdout.write(JSON.stringify({ level, ts: new Date().toISOString(), message, ...meta }) + '\n');
  }
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => { if (isDev) log('debug', msg, meta); },
};

export default logger;
