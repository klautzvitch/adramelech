import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} from 'discord.js';
import env from '~/env';
import type { Command } from '~/types/command';

export default <Command>{
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(intr) {
    await intr.reply({
      embeds: [
        {
          color: env.EMBED_COLOR,
          title: 'Pong!',
        },
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>({
          components: [
            new ButtonBuilder({
              customId: 'velocity',
              label: 'Velocity',
              style: ButtonStyle.Primary,
            }),
            new ButtonBuilder({
              label: 'Author',
              style: ButtonStyle.Link,
              url: env.AUTHOR_URL,
            }),
          ],
        }),
      ],
    });
  },
};
