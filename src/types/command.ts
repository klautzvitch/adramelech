import type {
  CommandInteraction,
  ContextMenuCommandBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { z } from 'zod';
import type { Precondition } from './precondition';

const commandFunction = z
  .function()
  .args(z.custom<CommandInteraction>())
  .returns(z.promise(z.void()));

export const commandSchema = z.object({
  data: z.custom<SlashCommandBuilder | ContextMenuCommandBuilder>(),
  uses: z.array(z.string()).optional(),
  cooldown: z.union([z.number(), z.boolean()]).optional(),
  preconditions: z.array(z.custom<Precondition>()).optional(),
  execute: z.union([commandFunction, z.array(commandFunction)]),
});

export type Command = Omit<z.infer<typeof commandSchema>, 'execute'> & {
  execute: z.infer<typeof commandFunction>;
};
