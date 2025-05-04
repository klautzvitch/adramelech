import { ActivityType, Events, version } from 'discord.js';
import type { Event } from '~/types/event';
import type { CustomClient } from '~';
import logger from '~/logger';
import kleur from 'kleur';

export const event = <Event>{
  name: Events.ClientReady,
  once: true,
  async execute(client: CustomClient) {
    logger.log();

    const library = `${kleur.magenta(' Discord.js')} ${kleur.dim(version)}`;
    const runtime = `${kleur.yellow(' Bun')} ${kleur.dim(Bun.version)}`;
    logger.log(`${library} / ${runtime}`);

    logger.log(kleur.green(` Online as ${kleur.bold(client.user!.tag)}`));
    logger.log(`󱞩 API Version: ${client.options.rest?.version}`);
    const presence = client.user!.presence.activities[0];
    logger.log(
      kleur.blue(`󱞩 Presence: ${ActivityType[presence.type]} ${presence.name}`)
    );
  },
};
