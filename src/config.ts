import { ActivityType, type PresenceData } from 'discord.js';
import { z } from 'zod';

const configSchema = z.object({
  token: z.string(),
  presence: z.custom<PresenceData>(),
  embedColor: z.number(),
  authorUrl: z.string().url().default('https://www.pudim.com.br'),
  repositoryUrl: z.string().url(),
  defaultCooldownSeconds: z.string().transform(Number),
  feedbackWebhook: z.string().url().optional(),
  userAgent: z.string().default('adramelech'),
  openWeatherKey: z.string().optional(),
});

export default configSchema.parse({
  token: Bun.env.BOT_TOKEN,
  presence: {
    activities: [
      {
        type: ActivityType.Watching,
        name: 'you <3',
      },
    ],
  },
  embedColor: 13346551,
  authorUrl: Bun.env.AUTHOR_URL,
  repositoryUrl: Bun.env.REPOSITORY_URL,
  defaultCooldownSeconds: Bun.env.DEFAULT_COOLDOWN_SECONDS,
  feedbackWebhook: Bun.env.FEEDBACK_WEBHOOK,
  userAgent: Bun.env.USER_AGENT,
  openWeatherKey: Bun.env.OPENWEATHER_KEY,
} as z.input<typeof configSchema>);
