import { addBreadcrumb, captureException, captureMessage } from '@sentry/bun';
import chalk from 'chalk';

type LogParams = [message?: unknown, ...params: unknown[]];

function log(...params: LogParams) {
  console.log(...params);
}

function info(...params: LogParams) {
  log(chalk.blue(''), ...params);
}
function success(...params: LogParams) {
  log(chalk.green(''), ...params);
}
function warn(...params: LogParams) {
  log(chalk.yellow(''), ...params);
  captureMessage(`Warning: ${String(params[0])}`, 'warning');
  addBreadcrumb({
    category: 'log',
    level: 'warning',
    message: params.map(String).join(' '),
  });
}
function error(...params: LogParams) {
  log(chalk.red(''), ...params);

  const potentialError = params[0];
  const extraData =
    params.length > 1
      ? {
          additional_info: params.slice(1),
        }
      : undefined;

  if (potentialError instanceof Error) {
    captureException(potentialError, { extra: extraData });
  } else {
    const message = `Logged Error: ${params.map((p) => (typeof p === 'string' ? p : JSON.stringify(p))).join(' ')}`;
    captureMessage(message, { level: 'error', extra: extraData });
    captureException(new Error(message), { extra: extraData });
  }
}

export default {
  log,
  info,
  success,
  warn,
  error,
};
