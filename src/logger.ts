import chalk from 'chalk';

type LogParams = [message?: unknown, ...params: unknown[]];

function log(...params: LogParams) {
  return console.log(...params);
}

function info(...params: LogParams) {
  return log(chalk.blue(''), ...params);
}
function success(...params: LogParams) {
  return log(chalk.green(''), ...params);
}
function warn(...params: LogParams) {
  return log(chalk.yellow(''), ...params);
}
function error(...params: LogParams) {
  return log(chalk.red(''), ...params);
}

export default {
  log,
  info,
  success,
  warn,
  error,
};
