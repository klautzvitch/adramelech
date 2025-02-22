import {
  ChatInputCommandInteraction,
  codeBlock,
  SlashCommandBuilder,
} from 'discord.js';
import ky from 'ky';
import { z } from 'zod';
import config from '~/config';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';

export default <Command>{
  data: new SlashCommandBuilder()
    .setName('short')
    .setDescription('Short a URL')
    .addStringOption((option) =>
      option.setName('url').setDescription('URL to short').setRequired(true)
    ),
  cooldown: true,
  uses: ['is.gd'],
  async execute(intr: ChatInputCommandInteraction) {
    await intr.deferReply();

    const url = intr.options.getString('url', true);
    const match = z.string().url().safeParse(url);
    if (!match.success) return await sendError(intr, 'Invalid URL');

    const response = await ky(
      `https://is.gd/create.php?format=simple&url=${url}`
    ).text();
    if (!response || response.startsWith('Error'))
      return await sendError(intr, 'Failed to short URL');

    await intr.followUp({
      embeds: [
        {
          color: config.embedColor,
          title: 'Short URL',
          fields: [
            {
              name: '> :outbox_tray: Original URL',
              value: codeBlock(url),
            },
            {
              name: '> :inbox_tray: Short URL',
              value: codeBlock(response),
            },
          ],
          footer: {
            text: 'Powered by is.gd',
          },
        },
      ],
    });
  },
};
