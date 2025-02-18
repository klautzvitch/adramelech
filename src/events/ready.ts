import { ActivityType, Events } from 'discord.js';
import type { Event } from '~/types/event';
import registerCommands from '~/utils/registerCommands';
import type { CustomClient } from '~';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: CustomClient) {
    await registerCommands(client);

    console.log(`Ready as ${client.user?.tag}`);
    console.log(`API Version: ${client.options.rest?.version}`);
    const presence = client.user!.presence.activities[0];
    console.log(`Presence: ${ActivityType[presence.type]} ${presence.name}`);
  },
} as Event;
