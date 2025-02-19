import { codeBlock, MessageFlags, WebhookClient } from 'discord.js';
import config from '~/config';
import type { Modal } from '~/types/modal';
import { sendError } from '~/utils/sendError';

export default <Modal>{
  customId: 'feedback-modal',
  async execute(intr) {
    const message = intr.fields.getTextInputValue('message');

    const webhook = new WebhookClient({ url: config.feedbackWebhook });

    try {
      await webhook.send({
        username: 'Adramelech Feedback',
        avatarURL: intr.client.user.avatarURL() ?? undefined,
        embeds: [
          {
            color: config.embedColor,
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
          color: config.embedColor,
          title: 'Feedback sent, thank you!',
        },
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
