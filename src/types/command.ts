import type {
  CommandInteraction,
  ContextMenuCommandBuilder,
  SlashCommandBuilder,
} from 'discord.js';
import { z } from 'zod';
import type { Precondition } from './precondition';

export const commandSchema = z.object({
  data: z.custom<SlashCommandBuilder | ContextMenuCommandBuilder>(),
  uses: z.array(z.string()).optional(),
  cooldown: z.union([z.number(), z.boolean()]).optional(),
  preconditions: z.array(z.custom<Precondition>()).optional(),
  execute: z
    .function()
    .args(z.custom<CommandInteraction>())
    .returns(z.promise(z.void())),
});

export type Command = z.infer<typeof commandSchema>;
