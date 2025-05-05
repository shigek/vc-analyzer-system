import { ConsoleLogger } from '@nestjs/common';

const dateTimeFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  fractionalSecondDigits: 3,
  hour12: false,
});

export class CustomLogger extends ConsoleLogger {
  constructor() {
    super();
  }

  /**
   * Customize log format
   * @override
   */
  formatMessage(
    logLevel,
    message,
    pidMessage,
    formattedLogLevel,
    contextMessage,
    timestampDiff,
  ) {
    const output = this.stringifyMessage(message, logLevel);
    const dateTime = dateTimeFormatter
      .format(Date.now())
      .replace(/\//g, '/')
      .replace(', ', ' ');
    return `[${dateTime}][${formattedLogLevel.trim()}]${contextMessage}${output}${timestampDiff}\n`;
  }
}
