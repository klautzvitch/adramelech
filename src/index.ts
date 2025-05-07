import '~/instrument'; // Sentry, import this first

import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { type Command } from '~/types/command';
import { type Event } from '~/types/event';
import { type Component } from '~/types/component';
import { type Modal } from '~/types/modal';
import env from '~/env';
import logger from '~/logger';
import registerCommands from '~/utils/registerCommands';
import { loadModules } from '~/loader';

export class CustomClient extends Client {
  commands: Collection<string, Command> = new Collection();
  events: Collection<string, Event> = new Collection();
  components: Collection<string, Component> = new Collection();
  modals: Collection<string, Modal> = new Collection();
  cooldowns: Collection<string, Collection<string, number>> = new Collection();
}

const client = new CustomClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
  presence: {
    activities: [
      {
        type: env.PRESENCE_TYPE,
        name: env.PRESENCE_NAME,
      },
    ],
  },
});

await loadModules(client);

if (client.commands.size > 0) await registerCommands(client);
else logger.warn('No commands found. Skipping command registration');

client.login(env.BOT_TOKEN);
