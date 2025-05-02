import chalk from 'chalk';
import { z } from 'zod';
import logger from './logger';

const envSchema = z.object({
  BOT_TOKEN: z.string(),
  BOT_ID: z.string(),
  SUPPORT_URL: z.string().url().default('https://www.pudim.com.br'),
  PRESENCE_TYPE: z.string().transform(Number),
  PRESENCE_NAME: z.string(),
  EMBED_COLOR: z.string().transform(Number),
  AUTHOR_URL: z.string().url().default('https://www.pudim.com.br'),
  REPOSITORY_URL: z.string().url(),
  DEFAULT_COOLDOWN_SECONDS: z.string().transform(Number),
  FEEDBACK_WEBHOOK: z.string().url().optional(),
  USER_AGENT: z.string().default('adramelech'),
  OPENWEATHER_KEY: z.string().optional(),
});

function validateEnv() {
  const result = envSchema.passthrough().safeParse(process.env);
  if (!result.success) {
    const u = chalk.underline;
    for (const error of result.error.errors) {
      logger.error(`ENV VAR  ${u.bold(error.path)} ${error.message}`);
      if (error.code === 'invalid_type')
        logger.log(
          chalk.dim(
            `󱞩 Expected: ${u.green(error.expected)} | Received: ${u.red(error.received)}`
          )
        );
    }
    process.exit(1);
  }
  logger.success(`Environment variables loaded`);

  return result.data;
}

const env = validateEnv();

export default env;
