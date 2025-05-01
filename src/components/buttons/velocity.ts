import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
} from 'discord.js';
import env from '~/env';
import type { Component } from '~/types/component';

export default <Component>{
  customId: 'velocity',
  type: ComponentType.Button,
  async execute(intr: ButtonInteraction) {
    await intr.update({
      embeds: [
        new EmbedBuilder({
          color: env.EMBED_COLOR,
          title: 'Velocity',
          description: `Latency: ${intr.client.ws.ping}ms`,
        }),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>({
          components: [
            new ButtonBuilder({
              customId: 'velocity',
              label: 'Velocity',
              style: ButtonStyle.Primary,
              disabled: true,
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
