import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import config from '~/config';
import type { Command } from '~/types/command';

export default <Command>{
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(intr) {
    await intr.reply({
      embeds: [
        {
          color: config.embedColor,
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
              url: config.authorUrl,
            }),
          ],
        }),
      ],
    });
  },
};
