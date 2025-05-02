import {
  ComponentType,
  MessageFlags,
  userMention,
  type TextChannel,
} from 'discord.js';
import env from '~/env';
import type { Modal } from '~/types/modal';
import { sendError } from '~/utils/sendError';

export default <Modal>{
  customId: 'echo-modal',
  async execute(intr) {
    const message = intr.fields.getTextInputValue('message');

    try {
      const channel = intr.channel as TextChannel;
      await channel.send({
        flags: MessageFlags.IsComponentsV2,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `\`\`\`${message}\`\`\``,
          },
          {
            type: ComponentType.TextDisplay,
            content: `> ${userMention(intr.user.id)}`,
          },
        ],
      });
    } catch {
      return await sendError(intr, 'Failed to send message.');
    }

    await intr.reply({
      flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
      components: [
        {
          type: ComponentType.Container,
          accent_color: env.EMBED_COLOR,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: '# Message sent successfully.',
            },
          ],
        },
      ],
    });
  },
};
