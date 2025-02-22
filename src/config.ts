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
  repositoryUrl: process.env.REPOSITORY_URL,
  defaultCooldownSeconds: process.env.DEFAULT_COOLDOWN_SECONDS,
  feedbackWebhook: process.env.FEEDBACK_WEBHOOK,
  userAgent: process.env.USER_AGENT,
  openWeatherKey: process.env.OPENWEATHER_KEY,
} as z.input<typeof configSchema>);
