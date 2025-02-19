import {
  ActionRowBuilder,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  CommandInteraction,
  ContextMenuCommandBuilder,
  SlashCommandBuilder,
  User,
  UserContextMenuCommandInteraction,
} from 'discord.js';
import config from '~/config';
import type { Command } from '~/types/command';

export default <Array<Command>>[
  {
    data: new SlashCommandBuilder()
      .setName('avatar')
      .setDescription('Get the avatar of a user')
      .addUserOption((option) =>
        option.setName('user').setDescription('The user to get the avatar of')
      ),
    async execute(intr: ChatInputCommandInteraction) {
      const user = intr.options.getUser('user') ?? intr.user;

      await helper(intr, user);
    },
  },
  {
    data: new ContextMenuCommandBuilder()
      .setName('Avatar')
      .setType(ApplicationCommandType.User),
    execute: async (intr: UserContextMenuCommandInteraction) =>
      await helper(intr, intr.targetUser),
  },
];

function helper(interaction: CommandInteraction, user: User) {
  return interaction.reply({
    embeds: [
      {
        color: config.embedColor,
        title: `Avatar of ${user.username}`,
        image: {
          url: user.displayAvatarURL({ size: 1024 }),
        },
      },
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        ['png', 'jpeg', 'webp', 'gif'].map(
          (ext) =>
            new ButtonBuilder({
              label: ext.toUpperCase(),
              style: ButtonStyle.Link,
              url: user.displayAvatarURL({
                extension: ext as 'png' | 'jpeg' | 'webp' | 'gif',
                size: 4096,
              }),
            })
        )
      ),
    ],
  });
}
