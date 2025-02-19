import { SlashCommandBuilder } from 'discord.js';
import ky from 'ky';
import { z } from 'zod';
import config from '~/config';
import type { Command } from '~/types/command';

const schema = z.array(
  z.object({
    url: z.string().url(),
  })
);

export default <Command>{
  data: new SlashCommandBuilder()
    .setName('cat')
    .setDescription('Get a random cat image'),
  cooldown: true,
  uses: ['thecatapi.com'],
  async execute(intr) {
    await intr.deferReply();

    const response = await ky
      .get('https://api.thecatapi.com/v1/images/search')
      .json();
    const { data, error } = schema.safeParse(response);
    if (error) return await intr.followUp('Failed to fetch a cat image');

    await intr.followUp({
      embeds: [
        {
          color: config.embedColor,
          image: { url: data[0].url },
          footer: { text: 'Powered by thecatapi.com' },
        },
      ],
    });
  },
};
