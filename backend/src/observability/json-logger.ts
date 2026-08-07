import type { LoggerService } from '@nestjs/common';

export class JsonLogger implements LoggerService {
  log(message: unknown, context?: string) {
    this.write('info', message, context);
  }

  error(message: unknown, trace?: string, context?: string) {
    this.write('error', message, context, trace);
  }

  warn(message: unknown, context?: string) {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string) {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string) {
    this.write('verbose', message, context);
  }

  private write(
    level: string,
    message: unknown,
    context?: string,
    trace?: string,
  ) {
    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      message: this.normalize(message),
    };
    if (context) entry.context = context;
    if (trace) entry.trace = trace;
    const serialized = JSON.stringify(entry);
    if (level === 'error') {
      console.error(serialized);
    } else if (level === 'warn') {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  }

  private normalize(message: unknown): unknown {
    if (message instanceof Error) {
      return { name: message.name, message: message.message };
    }
    return message;
  }
}
