import { stripIndents } from 'common-tags';
import {
  ActionRowBuilder,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  WebhookClient,
  type ModalActionRowComponentBuilder,
} from 'discord.js';
import env from '~/env';
import logger from '~/logger';
import type { Command } from '~/types/command';
import type { Modal } from '~/types/modal';
import { sendError } from '~/utils/sendError';

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('feedback')
    .setDescription('Send feedback to the bot developers'),
  cooldown: 86400, // 1 day
  async execute(intr) {
    if (!env.FEEDBACK_WEBHOOK)
      return await sendError(intr, 'Feedback is not configured');

    await intr.showModal({
      customId: 'feedback-modal',
      title: 'Feedback',
      components: [
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
          new TextInputBuilder({
            customId: 'message',
            label: 'Message',
            style: TextInputStyle.Paragraph,
            placeholder: 'Enter your feedback here',
          })
        ),
      ],
    });
  },
};

export const modal = <Modal>{
  customId: 'feedback-modal',
  async execute(intr) {
    if (!env.FEEDBACK_WEBHOOK)
      return await sendError(intr, 'Feedback is not configured');

    const message = intr.fields.getTextInputValue('message');

    const webhook = new WebhookClient({ url: env.FEEDBACK_WEBHOOK });

    try {
      await webhook.send({
        username: 'Adramelech Feedback',
        avatarURL: intr.client.user.avatarURL() ?? undefined,
        content: stripIndents`
        # Feedback
        From \`${intr.user.username}\` (\`${intr.user.id}\`)
        ### Message
        \`\`\`${message}\`\`\`
        `,
      });
    } catch (error) {
      logger.warn('Failed to send feedback', error);
      return await sendError(intr, 'Failed to send feedback.');
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
              content: '# Feedback sent, thank you!',
            },
          ],
        },
      ],
    });
  },
};
