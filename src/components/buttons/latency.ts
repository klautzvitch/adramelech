import { stripIndents } from 'common-tags';
import {
  ButtonInteraction,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} from 'discord.js';
import env from '~/env';
import type { Component } from '~/types/component';

export default <Component>{
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
