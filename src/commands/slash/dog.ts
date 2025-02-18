import { SlashCommandBuilder } from 'discord.js';
import ky from 'ky';
import { z } from 'zod';
import config from '~/config';
import type { Command } from '~/types/command';

const schema = z.object({
  status: z.literal('success'),
  message: z.string().url(),
});

export default {
  data: new SlashCommandBuilder()
    .setName('dog')
    .setDescription('Get a random dog image'),
  uses: ['dog.ceo'],
  cooldown: true,
  async execute(intr) {
    await intr.deferReply();

    const response = await ky
      .get('https://dog.ceo/api/breeds/image/random')
      .json();
    const { data, error } = schema.safeParse(response);
    if (error) {
      return await intr.editReply('Failed to fetch image');
    }

    await intr.followUp({
      embeds: [
        {
          color: config.embedColor,
          image: {
            url: data.message,
          },
          footer: {
            text: 'Powered by dog.ceo',
          },
        },
      ],
    });
  },
} as Command;
