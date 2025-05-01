import {
  ChatInputCommandInteraction,
  codeBlock,
  SlashCommandBuilder,
  time,
} from 'discord.js';
import ky from 'ky';
import { z } from 'zod';
import env from '~/env';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';
import toUnixTimestamps from '~/utils/toUnixTimestamps';

const schema = z.object({
  id: z.string(),
  destination: z.string(),
  method: z.union([
    z.literal('SKETCHY'),
    z.literal('OWO'),
    z.literal('GAY'),
    z.literal('ZWS'),
  ]),
  metadata: z.union([
    z.literal('IGNORE'),
    z.literal('PROXY'),
    z.literal('OWOIFY'),
  ]),
  createdAt: z
    .string()
    .datetime()
    .transform((date) => toUnixTimestamps(new Date(date).getTime())),
});

export default <Command>{
  data: new SlashCommandBuilder()
    .setName('obfuscate')
    .setDescription('Obfuscate a URL')
    .addStringOption((option) =>
      option
        .setName('url')
        .setDescription('The URL to obfuscate')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('generator')
        .setDescription('The generator to use (default: sketchy)')
        .addChoices(
          {
            name: 'Sketchy',
            value: 'sketchy',
          },
          {
            name: 'OwO',
            value: 'owo',
          },
          {
            name: 'Gay',
            value: 'gay',
          },
          {
            name: 'Zero Width Space',
            value: 'zws',
          }
        )
    )
    .addStringOption((option) =>
      option
        .setName('metadata')
        .setDescription('What to do with metadata (default: proxy)')
        .addChoices(
          {
            name: 'Ignore',
            value: 'IGNORE',
          },
          {
            name: 'Proxy',
            value: 'PROXY',
          },
          {
            name: 'OwOify',
            value: 'OWOIFY',
          }
        )
    ),
  cooldown: true,
  uses: ['owo.vc'],
  async execute(intr: ChatInputCommandInteraction) {
    await intr.deferReply();

    const url = intr.options.getString('url', true);
    const generator = intr.options.getString('generator') ?? 'sketchy';
    const metadata = intr.options.getString('metadata') ?? 'PROXY';

    const match = z.string().url().safeParse(url);
    if (!match.success) return await sendError(intr, 'Invalid URL provided');

    const response = await ky
      .post('https://owo.vc/api/v2/link', {
        json: {
          link: url,
          generator,
          metadata,
        },
        headers: {
          'User-Agent': env.USER_AGENT,
        },
      })
      .json();
    const { data, error } = schema.safeParse(response);
    if (error) return await sendError(intr, 'Failed to parse response');

    await intr.followUp({
      embeds: [
        {
          color: env.EMBED_COLOR,
          title: 'Obfuscated URL',
          fields: [
            {
              name: '> :outbox_tray: Original URL',
              value: codeBlock(data.destination),
            },
            {
              name: '> :inbox_tray: Obfuscated URL',
              value: codeBlock(data.id),
            },
            {
              name: '> :wrench: Method',
              value: codeBlock(data.method),
            },
            {
              name: '> :information_source: Metadata',
              value: codeBlock(data.metadata),
            },
            {
              name: '> :clock1: Created At',
              value: time(data.createdAt),
            },
          ],
          footer: {
            text: 'Powered by owo.vc',
          },
        },
      ],
    });
  },
};
