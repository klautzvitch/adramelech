import { ActivityType, Events, version } from 'discord.js';
import type { Event } from '~/types/event';
import type { CustomClient } from '~';
import logger from '~/logger';
import chalk from 'chalk';

export default <Event>{
  name: Events.ClientReady,
  once: true,
  async execute(client: CustomClient) {
    logger.log();

    const library = `${chalk.magenta(' Discord.js')} ${chalk.reset.dim(version)}`;
    const runtime = `${chalk.yellow(' Bun')} ${chalk.reset.dim(Bun.version)}`;
    logger.log(`${library} / ${runtime}`);

    logger.log(chalk.green(` Online as ${chalk.bold(client.user?.tag)}`));
    logger.log(
      `󱞩 API Version: ${chalk.underline(client.options.rest?.version)}`
    );
    const presence = client.user!.presence.activities[0];
    logger.log(
      chalk.blue(`󱞩 Presence: ${ActivityType[presence.type]} ${presence.name}`)
    );
  },
};
