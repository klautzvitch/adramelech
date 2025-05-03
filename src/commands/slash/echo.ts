import {
  ActionRowBuilder,
  ComponentType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
  userMention,
  type ModalActionRowComponentBuilder,
} from 'discord.js';
import env from '~/env';
import type { Command } from '~/types/command';
import type { Modal } from '~/types/modal';
import { sendError } from '~/utils/sendError';

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('echo')
    .setDescription('Echoes a message')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(intr) {
    await intr.showModal({
      customId: 'echo-modal',
      title: 'Echo',
      components: [
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
          new TextInputBuilder({
            customId: 'message',
            label: 'Message',
            style: TextInputStyle.Paragraph,
          })
        ),
      ],
    });
  },
};

export const modal = <Modal>{
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
