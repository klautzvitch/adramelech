import type { ModalSubmitInteraction } from 'discord.js';
import type {
  CommandInteraction,
  ComponentInteraction,
} from '~/events/interactionCreate';

export type Precondition = (
  interaction:
    | CommandInteraction
    | ComponentInteraction
    | ModalSubmitInteraction
) => Promise<boolean>;
