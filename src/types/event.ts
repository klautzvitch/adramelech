import type { Client, Events, Interaction } from 'discord.js';
import { z } from 'zod';

export const eventSchema = z.object({
  name: z.custom<Events>(),
  once: z.boolean().optional(),
  execute: z
    .function()
    .args(z.custom<Client | Interaction>())
    .returns(z.promise(z.void())),
});

export type Event = z.infer<typeof eventSchema>;
