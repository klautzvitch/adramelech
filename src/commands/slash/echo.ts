import {
  ActionRowBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ModalActionRowComponentBuilder,
} from 'discord.js';
import type { Command } from '~/types/command';

export default <Command>{
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
