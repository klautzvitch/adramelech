import { ActivityType, type PresenceData } from 'discord.js';
import { z } from 'zod';

const configSchema = z.object({
  token: z.string(),
  presence: z.custom<PresenceData>(),
  embedColor: z.number(),
  authorUrl: z.string().url(),
  defaultCooldownSeconds: z.string().transform(Number),
});

export default configSchema.parse({
  token: process.env.BOT_TOKEN,
  presence: {
    activities: [
      {
        type: ActivityType.Watching,
        name: 'you <3',
      },
    ],
  },
  embedColor: 13346551,
  authorUrl: process.env.AUTHOR_URL,
  defaultCooldownSeconds: process.env.DEFAULT_COOLDOWN_SECONDS,
} as z.input<typeof configSchema>);
