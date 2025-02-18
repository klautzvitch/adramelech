import { REST, Routes } from 'discord.js';
import type { CustomClient } from '~';
import config from '~/config';

export default async function registerCommands(client: CustomClient) {
  const commands = client.commands.map((command) => command.data.toJSON());
  const rest = new REST().setToken(config.token);

  try {
    console.log(`Started refreshing ${commands.length} application commands.`);

    const data = (await rest.put(Routes.applicationCommands(client.user!.id), {
      body: commands,
    })) as unknown[];

    console.log(`Successfully refreshed ${data.length} application commands.`);
  } catch (error) {
    console.error('Failed to refresh application commands.', error);
    throw error;
  }
}
