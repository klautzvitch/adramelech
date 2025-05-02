import { ComponentType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import ky from 'ky';
import { z } from 'zod';
import env from '~/env';
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
      flags: MessageFlags.IsComponentsV2,
      components: [
        {
          type: ComponentType.Container,
          accent_color: env.EMBED_COLOR,
          components: [
            {
              type: ComponentType.MediaGallery,
              items: [
                {
                  media: {
                    url: data[0].url,
                  },
                },
              ],
            },
            {
              type: ComponentType.TextDisplay,
              content: '> Powered by thecatapi.com',
            },
          ],
        },
      ],
    });
  },
};
