import { stripIndents } from 'common-tags';
import {
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import env from '~/env';
import type { Command } from '~/types/command';
import type { Component } from '~/types/component';

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(intr) {
    await intr.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [
        {
          type: ComponentType.Container,
          accent_color: env.EMBED_COLOR,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: '# Pong!',
            },
            { type: ComponentType.Separator, divider: false },
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.Button,
                  custom_id: 'latency',
                  label: 'Velocity',
                  style: ButtonStyle.Primary,
                },
                {
                  type: ComponentType.Button,
                  label: 'Author',
                  style: ButtonStyle.Link,
                  url: env.AUTHOR_URL,
                },
              ],
            },
          ],
        },
      ],
    });
  },
};

export const component = <Component>{
  customId: 'latency',
  type: ComponentType.Button,
  async execute(intr: ButtonInteraction) {
    await intr.update({
      flags: MessageFlags.IsComponentsV2,
      components: [
        {
          type: ComponentType.Container,
          accent_color: env.EMBED_COLOR,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: stripIndents`
              # Pong!
              ## Latency: \`${intr.client.ws.ping}ms\`
              `,
            },
            { type: ComponentType.Separator, divider: false },
            { type: ComponentType.Separator, divider: false },
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.Button,
                  custom_id: 'velocity',
                  label: 'Velocity',
                  style: ButtonStyle.Primary,
                  disabled: true,
                },
                {
                  type: ComponentType.Button,
                  label: 'Author',
                  style: ButtonStyle.Link,
                  url: env.AUTHOR_URL,
                },
              ],
            },
          ],
        },
      ],
    });
  },
};
