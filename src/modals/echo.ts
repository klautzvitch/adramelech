import { MessageFlags, userMention, type TextChannel } from 'discord.js';
import config from '~/config';
import type { Modal } from '~/types/modal';
import { sendError } from '~/utils/sendError';

export default <Modal>{
  customId: 'echo-modal',
  async execute(intr) {
    const message = intr.fields.getTextInputValue('message');

    try {
      const channel = intr.channel as TextChannel;
      await channel.send(`${message}\n> ${userMention(intr.user.id)}`);
    } catch {
      return await sendError(intr, 'Failed to send message.');
    }

    await intr.reply({
      embeds: [
        {
          color: config.embedColor,
          title: 'Message Sent',
        },
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};
