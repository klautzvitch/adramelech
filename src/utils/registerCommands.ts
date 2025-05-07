import { REST, Routes } from 'discord.js';
import type { CustomClient } from '~';
import env from '~/env';
import logger from '~/logger';

export default async function registerCommands(client: CustomClient) {
  const commands = client.commands.map((command) => command.data.toJSON());
  const rest = new REST().setToken(env.BOT_TOKEN);

  try {
    const data = (await rest.put(Routes.applicationCommands(env.BOT_ID), {
      body: commands,
    })) as unknown[];

    logger.success(`${data.length} commands registered`);
  } catch (error) {
    logger.error('Error refreshing application commands', error);
    throw error;
  }
}
