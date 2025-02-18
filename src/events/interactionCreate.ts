import { Events, type Interaction } from 'discord.js';
import type { Event } from '~/types/event';
import type { CustomClient } from '..';
import { sendError } from '~/utils/sendError';

export default {
  name: Events.InteractionCreate,
  async execute(intr: Interaction) {
    const client = intr.client as CustomClient;

    if (intr.isCommand()) await handleCommands(intr, client);
    else if (intr.isMessageComponent()) await handleComponents(intr, client);
    else await sendError(intr, 'Unknown interaction type');
  },
} as Event;

async function handleCommands(intr: Interaction, client: CustomClient) {
  if (!intr.isCommand()) return;

  const command = client.commands.get(intr.commandName);
  if (!command) {
    await sendError(intr, 'Command not found');
    return;
  }

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

async function handleComponents(intr: Interaction, client: CustomClient) {
  if (!intr.isMessageComponent()) return;

  const component = client.components.get(intr.customId);
  if (!component) {
    await sendError(intr, 'Component not found');
    return;
  }

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
  } catch (error) {
    await sendError(intr, `Error executing ${interactionType}`);
    console.error(`Error executing ${interactionType} ${name}`);
    console.error(error);
  }
}
