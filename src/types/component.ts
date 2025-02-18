import type { ComponentType, MessageComponentInteraction } from 'discord.js';
import { z } from 'zod';

export const componentSchema = z.object({
  customId: z.string(),
  type: z.custom<ComponentType>(),
  cooldown: z.union([z.number(), z.boolean()]).optional(),
  execute: z
    .function()
    .args(z.custom<MessageComponentInteraction>())
    .returns(z.promise(z.void())),
});

export type Component = z.infer<typeof componentSchema>;
