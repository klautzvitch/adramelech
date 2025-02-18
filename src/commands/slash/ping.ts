import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} from 'discord.js';
import config from '~/config';
import type { Command } from '~/types/command';

export default {
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
              customId: 'ping',
              label: 'Ping',
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
} as Command;
