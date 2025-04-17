import { z } from 'zod';
import type { Precondition } from './precondition';
import type { ModalSubmitInteraction } from 'discord.js';
import { customId } from '~/types/customId';

export const modalSchema = z.object({
  customId: customId,
  cooldown: z.union([z.number(), z.boolean()]).optional(),
  preconditions: z.array(z.custom<Precondition>()).optional(),
  execute: z
    .function()
    .args(z.custom<ModalSubmitInteraction>())
    .returns(z.promise(z.void())),
});

export type Modal = z.infer<typeof modalSchema>;
