import { codeBlock, MessageFlags, WebhookClient } from 'discord.js';
import env from '~/env';
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
        embeds: [
          {
            color: env.EMBED_COLOR,
            title: 'Feedback',
            description: `From \`${intr.user.username}\` (\`${intr.user.id}\`)`,
            fields: [
              {
                name: '> Message',
                value: codeBlock(message),
              },
            ],
          },
        ],
      });
    } catch {
      return await sendError(intr, 'Failed to send feedback.');
    }

    await intr.reply({
      embeds: [
        {
          color: env.EMBED_COLOR,
          title: 'Feedback sent, thank you!',
        },
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
