import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Collection,
  Events,
  InteractionType,
  MessageContextMenuCommandInteraction,
  ModalSubmitInteraction,
  UserContextMenuCommandInteraction,
  type AnySelectMenuInteraction,
  type Interaction,
} from 'discord.js';
import type { Event } from '~/types/event';
import type { CustomClient } from '..';
import { sendError } from '~/utils/sendError';
import type { Command } from '~/types/command';
import type { Component } from '~/types/component';
import config from '~/config';
import type { Modal } from '~/types/modal';

export type CommandInteraction =
  | ChatInputCommandInteraction
  | MessageContextMenuCommandInteraction
  | UserContextMenuCommandInteraction;
export type ComponentInteraction = AnySelectMenuInteraction | ButtonInteraction;

export default <Event>{
  name: Events.InteractionCreate,
  async execute(intr: Interaction) {
    const client = intr.client as CustomClient;

    switch (intr.type) {
      case InteractionType.ApplicationCommand:
        await handleCommands(intr, client);
        break;
      case InteractionType.MessageComponent:
        await handleComponents(intr, client);
        break;
      case InteractionType.ModalSubmit:
        await handleModals(intr, client);
        break;
      default:
        await sendError(intr, 'Unknown interaction type');
        break;
    }
  },
};

async function handleCommands(intr: CommandInteraction, client: CustomClient) {
  const command = client.commands.get(intr.commandName);
  if (!command) {
    await sendError(intr, 'Command not found');
    return;
  }

  if (isOnCooldown(client, intr, command, intr.commandName)) return;
  if (!(await handlePreconditions(intr, command))) return;

  const commandType = command.data.toJSON().type;
  if (intr.commandType !== commandType) {
    await handleTypeMismatch(
      'command',
      intr.commandName,
      intr.commandType,
      commandType,
      intr
    );
    return;
  }

  await executeInteraction(
    'command',
    intr.commandName,
    () => command.execute(intr),
    intr
  );
}

async function handleComponents(
  intr: ComponentInteraction,
  client: CustomClient
) {
  const component = client.components.get(intr.customId);
  if (!component) {
    await sendError(intr, 'Component not found');
    return;
  }

  if (isOnCooldown(client, intr, component, intr.customId)) return;
  if (!(await handlePreconditions(intr, component))) return;

  if (intr.componentType !== component.type) {
    await handleTypeMismatch(
      'component',
      intr.customId,
      intr.componentType,
      component.type,
      intr
    );
    return;
  }

  await executeInteraction(
    'component',
    intr.customId,
    () => component.execute(intr),
    intr
  );
}

async function handleModals(
  intr: ModalSubmitInteraction,
  client: CustomClient
) {
  const modal = client.modals.get(intr.customId);
  if (!modal) {
    await sendError(intr, 'Modal not found');
    return;
  }

  if (isOnCooldown(client, intr, modal, intr.customId)) return;
  if (!(await handlePreconditions(intr, modal))) return;

  if (intr.type !== InteractionType.ModalSubmit) {
    await handleTypeMismatch(
      'modal',
      intr.customId,
      intr.type,
      InteractionType.ModalSubmit,
      intr
    );
    return;
  }

  await executeInteraction(
    'modal',
    intr.customId,
    () => modal.execute(intr),
    intr
  );
}

async function handlePreconditions(
  intr: CommandInteraction | ComponentInteraction | ModalSubmitInteraction,
  item: Command | Component | Modal
): Promise<boolean> {
  if (item.preconditions) {
    for (const precondition of item.preconditions) {
      if (!(await precondition(intr))) return false;
    }
  }
  return true;
}

function isOnCooldown(
  client: CustomClient,
  intr: Interaction,
  item: Command | Component | Modal,
  name: string
): boolean {
  if (!item.cooldown || process.env.NODE_ENV === 'development') return false;

  const cooldowns = client.cooldowns.get(name) ?? new Collection();
  client.cooldowns.set(name, cooldowns);

  const now = Date.now();
  const timestamps = client.cooldowns.get(name)!;
  const cooldownAmount =
    (typeof item.cooldown === 'boolean'
      ? config.defaultCooldownSeconds
      : item.cooldown) * 1000;

  const userCooldown = timestamps.get(intr.user.id);
  if (userCooldown && now < userCooldown) {
    const remainingTime = Math.round((userCooldown - now) / 1000);
    sendError(intr, `Your on cooldown for ${remainingTime} seconds`);
    return true;
  }

  cooldowns.set(intr.user.id, now + cooldownAmount);
  setTimeout(() => timestamps.delete(intr.user.id), cooldownAmount);
  return false;
}

async function handleTypeMismatch(
  interactionType: string,
  name: unknown,
  actualType: unknown,
  expectedType: unknown,
  intr: Interaction
) {
  await sendError(intr, `${interactionType} type mismatch`);
  console.error(`Error executing ${interactionType} ${name}`);
  console.error(
    `${interactionType} type mismatch: ${actualType} !== ${expectedType}`
  );
}

async function executeInteraction(
  interactionType: string,
  name: string,
  fn: () => Promise<void>,
  intr: Interaction
) {
  try {
    await fn();
  } catch (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any
  ) {
    await sendError(intr, error.message);
    console.error(`Error executing ${interactionType} ${name}`);
    console.error(error);
  }
}
