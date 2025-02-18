import type {
  CommandInteraction,
  ComponentInteraction,
} from '~/events/interactionCreate';

export type Precondition = (
  interaction: CommandInteraction | ComponentInteraction
) => Promise<boolean>;
