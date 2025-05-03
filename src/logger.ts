import { captureException, captureMessage } from '@sentry/bun';
import chalk from 'chalk';
import { format } from 'util';

const ICONS = {
  info: '',
  success: '',
  warn: '',
  error: '',
};

type LogParams = [message?: unknown, ...params: unknown[]];

function prepareSentryExtra(
  data: unknown
): Record<string, unknown> | undefined {
  if (data === undefined || (Array.isArray(data) && data.length === 0))
    return undefined;

  // Sentry's captureException/captureMessage can often handle various types,
  // but wrapping in a structured way is good practice.
  // Ensure it's serializable if passing complex objects.
  // For simplicity here, we'll wrap it directly.
  return { additional_info: data };
}

function log(...params: LogParams) {
  console.log(...params);
}

function info(...params: LogParams) {
  log(chalk.blue(ICONS.info), ...params);
}
function success(...params: LogParams) {
  log(chalk.green(ICONS.success), ...params);
}
function warn(...params: LogParams) {
  log(chalk.yellow(ICONS.warn), ...params);

  const message = format(...params);
  captureMessage(`Warning: ${message}`, { level: 'warning' });
}
function error(...params: LogParams) {
  log(chalk.red(ICONS.error), ...params);

  const [firstParam, ...restParams] = params;
  const extraData = prepareSentryExtra(restParams);

  if (firstParam instanceof Error) {
    // Capture the provide Error object directly to preserve stack trace
    captureException(firstParam, {
      extra: extraData,
    });
  } else {
    const message = format(...params);
    captureException(new Error(message), {
      extra: extraData,
    });
  }
}

export default {
  log,
  info,
  success,
  warn,
  error,
};
