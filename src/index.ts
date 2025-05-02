import '~/instrument'; // Sentry, import this first

import {
  Client,
  Collection,
  GatewayIntentBits,
  type ClientEvents,
} from 'discord.js';
import path from 'path';
import { commandSchema, type Command } from '~/types/command';
import { eventSchema, type Event } from '~/types/event';
import findRecursively from '~/utils/findRecursively';
import { componentSchema, type Component } from '~/types/component';
import { modalSchema, type Modal } from '~/types/modal';
import env from '~/env';
import logger from '~/logger';
import registerCommands from '~/utils/registerCommands';
import chalk from 'chalk';

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

async function loadCommands() {
  const commandsFiles = await findRecursively(path.join(__dirname, 'commands'));
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

  const commandsCount = await registerCommands(client);
  logger.success(`${chalk.underline(commandsCount)} commands loaded`);
}

function validateAndSetCommands(rawCommand: unknown, file: string) {
  // Ignore as it is probably a commented-out/archived command
  if (rawCommand === undefined) return;

  const { data: command, success, error } = commandSchema.safeParse(rawCommand);
  if (!success) {
    logger.error(`Invalid command file: ${file}`, error.errors);
    return;
  }
  client.commands.set(command.data.name, command as Command);
}

async function loadEvents() {
  const eventsFiles = await findRecursively(path.join(__dirname, 'events'));
  for (const file of eventsFiles) {
    const rawEvent = (await import(file)).default;

    const { data: event, success, error } = eventSchema.safeParse(rawEvent);
    if (!success) {
      logger.error(`Invalid event file: ${file}`, error.errors);
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
  const componentsFiles = await findRecursively(
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
      logger.error(`Invalid component file: ${file}`, error.errors);
      continue;
    }

    client.components.set(component.customId, component);
  }
}

async function loadModals() {
  const modalsFiles = await findRecursively(path.join(__dirname, 'modals'));
  for (const file of modalsFiles) {
    const rawModal = (await import(file)).default;

    const { data: modal, success, error } = modalSchema.safeParse(rawModal);
    if (!success) {
      logger.error(`Invalid modal file: ${file}`, error.errors);
      continue;
    }

    client.modals.set(modal.customId, modal);
  }
}

await Promise.all([
  loadCommands(),
  loadEvents(),
  loadComponents(),
  loadModals(),
]);

client.login(env.BOT_TOKEN);
