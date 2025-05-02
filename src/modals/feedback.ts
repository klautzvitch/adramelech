import { stripIndents } from 'common-tags';
import { ComponentType, MessageFlags, WebhookClient } from 'discord.js';
import env from '~/env';
import logger from '~/logger';
import type { Modal } from '~/types/modal';
import { sendError } from '~/utils/sendError';

export default <Modal>{
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
