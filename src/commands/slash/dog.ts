import { SlashCommandBuilder } from 'discord.js';
import ky from 'ky';
import { z } from 'zod';
import env from '~/env';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';

const schema = z.object({
  status: z.literal('success'),
  message: z.string().url(),
});

export default <Command>{
  data: new SlashCommandBuilder()
    .setName('dog')
    .setDescription('Get a random dog image'),
  uses: ['dig.ceo'],
  cooldown: true,
  async execute(intr) {
    await intr.deferReply();

    const response = await ky
      .get('https://dog.ceo/api/breeds/image/random')
      .json();
    const { data, error } = schema.safeParse(response);
    if (error) return await sendError(intr, 'Failed to fetch a dog image');

    await intr.followUp({
      embeds: [
        {
          color: env.EMBED_COLOR,
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
};
