import {
  ActionRowBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ModalActionRowComponentBuilder,
} from 'discord.js';
import env from '~/env';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';

export default <Command>{
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
