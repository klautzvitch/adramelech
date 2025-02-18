import {
  Client,
  Collection,
  GatewayIntentBits,
  type ClientEvents,
} from 'discord.js';
import path from 'path';
import config from '~/config';
import { commandSchema, type Command } from '~/types/command';
import { eventSchema, type Event } from '~/types/event';
import findAllFiles from '~/utils/findRecursively';
import { componentSchema, type Component } from '~/types/component';

export class CustomClient extends Client {
  commands: Collection<string, Command> = new Collection();
  events: Collection<string, Event> = new Collection();
  components: Collection<string, Component> = new Collection();
}

const client = new CustomClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
  presence: config.presence,
});

async function loadCommands() {
  const commandsFiles = await findAllFiles(path.join(__dirname, 'commands'));
  for (const file of commandsFiles) {
    const rawCommand = (await import(file)).default;

    // Support for multiple commands in a single file
    if (Array.isArray(rawCommand)) {
      for (const command of rawCommand) {
        validateAndSetCommands(command, file);
      }
      continue;
    }

    validateAndSetCommands(rawCommand, file);
  }
}

function validateAndSetCommands(rawCommand: unknown, file: string) {
  const { data: command, success, error } = commandSchema.safeParse(rawCommand);
  if (!success) {
    console.error(`Invalid command file: ${file}`);
    console.error(error.errors);
    return;
  }
  client.commands.set(command.data.name, command as Command);
}

async function loadEvents() {
  const eventsFiles = await findAllFiles(path.join(__dirname, 'events'));
  for (const file of eventsFiles) {
    const rawEvent = (await import(file)).default;

    const { data: event, success, error } = eventSchema.safeParse(rawEvent);
    if (!success) {
      console.error(`Invalid event file: ${file}`);
      console.error(error.errors);
      continue;
    }

    const eventHandler = (...args: unknown[]) => rawEvent.execute(...args);
    if (event.once) {
      client.once(event.name as keyof ClientEvents, eventHandler);
    } else {
      client.on(event.name as keyof ClientEvents, eventHandler);
    }
  }
}

async function loadComponents() {
  const componentsFiles = await findAllFiles(
    path.join(__dirname, 'components')
  );
  for (const file of componentsFiles) {
    const rawComponent = (await import(file)).default;

    const {
      data: component,
      success,
      error,
    } = componentSchema.safeParse(rawComponent);
    if (!success) {
      console.error(`Invalid component file: ${file}`);
      console.error(error.errors);
      continue;
    }

    client.components.set(component.customId, component);
  }
}

await Promise.all([loadCommands(), loadEvents(), loadComponents()]);

client.login(config.token);
