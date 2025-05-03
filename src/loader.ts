import type { CustomClient } from '~';
import { commandSchema, type Command } from '~/types/command';
import { componentSchema } from '~/types/component';
import { eventSchema } from '~/types/event';
import { modalSchema } from '~/types/modal';
import logger from '~/logger';
import type { ClientEvents } from 'discord.js';
import path from 'path';
import findRecursively from './utils/findRecursively';

// Be aware that this way of doing things allows for loading anything from any folder
// Please respect the structure of the folders
// Events only in events folder

const FOLDERS_TO_LOAD = ['commands', 'events'];

const EXPORT_TYPES = {
  command: { singular: 'command', plural: 'commands', schema: commandSchema },
  event: { singular: 'event', plural: 'events', schema: eventSchema },
  component: {
    singular: 'component',
    plural: 'components',
    schema: componentSchema,
  },
  modal: { singular: 'modal', plural: 'modals', schema: modalSchema },
} as const;

function addCommand(client: CustomClient, rawCommand: unknown, file: string) {
  if (rawCommand === null) return;
  const result = commandSchema.safeParse(rawCommand);
  if (!result.success) {
    logger.error(`Invalid command file: ${file}`, result.error.errors);
    return;
  }
  const command = result.data as Command;
  if (client.commands.has(command.data.name)) {
    logger.error(
      `Duplicate command name ${command.data.name} in ${file}. Overwriting.`
    );
  }
  client.commands.set(command.data.name, command);
}

function registerEvent(
  client: CustomClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawEvent: any,
  file: string
): void {
  if (rawEvent === null) return;
  const result = eventSchema.safeParse(rawEvent);
  if (!result.success) {
    logger.error(`Invalid event file: ${file}`, result.error.errors);
    return;
  }
  const event = result.data;
  // Use rawEvent so we bypass the type check
  const eventHandler = (...args: unknown[]) => rawEvent.execute(...args);
  if (event.once) {
    client.once(event.name as keyof ClientEvents, eventHandler);
  } else {
    client.on(event.name as keyof ClientEvents, eventHandler);
  }
}

function addComponent(
  client: CustomClient,
  rawComponent: unknown,
  file: string
) {
  if (rawComponent === null) return;
  const result = componentSchema.safeParse(rawComponent);
  if (!result.success) {
    logger.error(`Invalid component file: ${file}`, result.error.errors);
    return;
  }
  const component = result.data;
  if (client.components.has(component.customId)) {
    logger.error(
      `Duplicate component id ${component.customId} in ${file}. Overwriting.`
    );
  }
  client.components.set(component.customId, component);
}

function addModal(client: CustomClient, rawModal: unknown, file: string) {
  if (rawModal === null) return;
  const result = modalSchema.safeParse(rawModal);
  if (!result.success) {
    logger.error(`Invalid modal file: ${file}`, result.error.errors);
    return;
  }
  const modal = result.data;
  if (client.modals.has(modal.customId)) {
    logger.error(
      `Duplicate modal id ${modal.customId} in ${file}. Overwriting.`
    );
  }
  client.modals.set(modal.customId, modal);
}

export async function loadModules(client: CustomClient) {
  const loadedCounts = {
    commands: 0,
    events: 0,
    components: 0,
    modals: 0,
  };

  for (const folder of FOLDERS_TO_LOAD) {
    const folderPath = path.join(__dirname, folder);

    const files = await findRecursively(folderPath);
    if (files.length === 0) continue;

    for (const file of files) {
      const moduleExports = await import(file);

      if (moduleExports[EXPORT_TYPES.command.singular]) {
        addCommand(client, moduleExports[EXPORT_TYPES.command.singular], file);
        loadedCounts.commands++;
      }
      if (
        moduleExports[EXPORT_TYPES.command.plural] &&
        Array.isArray(moduleExports[EXPORT_TYPES.command.plural])
      ) {
        for (const command of moduleExports[EXPORT_TYPES.command.plural]) {
          addCommand(client, command, file);
          loadedCounts.commands++;
        }
      }

      if (moduleExports[EXPORT_TYPES.event.singular]) {
        registerEvent(client, moduleExports[EXPORT_TYPES.event.singular], file);
        loadedCounts.events++;
      }
      if (
        moduleExports[EXPORT_TYPES.event.plural] &&
        Array.isArray(moduleExports[EXPORT_TYPES.event.plural])
      ) {
        for (const event of moduleExports[EXPORT_TYPES.event.plural]) {
          registerEvent(client, event, file);
          loadedCounts.events++;
        }
      }

      if (moduleExports[EXPORT_TYPES.component.singular]) {
        addComponent(
          client,
          moduleExports[EXPORT_TYPES.component.singular],
          file
        );
        loadedCounts.components++;
      }
      if (
        moduleExports[EXPORT_TYPES.component.plural] &&
        Array.isArray(moduleExports[EXPORT_TYPES.component.plural])
      ) {
        for (const component of moduleExports[EXPORT_TYPES.component.plural]) {
          addComponent(client, component, file);
          loadedCounts.components++;
        }
      }

      if (moduleExports[EXPORT_TYPES.modal.singular]) {
        addModal(client, moduleExports[EXPORT_TYPES.modal.singular], file);
        loadedCounts.modals++;
      }
      if (
        moduleExports[EXPORT_TYPES.modal.plural] &&
        Array.isArray(moduleExports[EXPORT_TYPES.modal.plural])
      ) {
        for (const modal of moduleExports[EXPORT_TYPES.modal.plural]) {
          addModal(client, modal, file);
          loadedCounts.modals++;
        }
      }
    }
  }

  logger.info(
    `Loaded ${loadedCounts.commands} commands, ${loadedCounts.events} events, ${loadedCounts.components} components, and ${loadedCounts.modals} modals.`
  );
}
