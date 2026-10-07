type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

const REDACT_KEYS = ['privatekey', 'pinata_jwt', 'jwt', 'secret', 'password', 'authorization'];

function sanitize(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (REDACT_KEYS.some((k) => key.toLowerCase().includes(k))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

class Logger {
  private format(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaString = meta ? ` | ${JSON.stringify(sanitize(meta))}` : '';
    return `[${timestamp}] [${level}] ${message}${metaString}`;
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.format('DEBUG', message, meta));
    }
  }

  info(message: string, meta?: any): void {
    console.info(this.format('INFO', message, meta));
  }

  warn(message: string, meta?: any): void {
    console.warn(this.format('WARN', message, meta));
  }

  error(message: string, error?: any): void {
    const meta = error instanceof Error
      ? { message: error.message, name: error.name, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined }
      : error;
    console.error(this.format('ERROR', message, meta));
  }
}

export const logger = new Logger();
