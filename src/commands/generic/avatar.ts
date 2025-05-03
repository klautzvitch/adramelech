import {
  ApplicationCommandType,
  ButtonStyle,
  ChatInputCommandInteraction,
  CommandInteraction,
  ComponentType,
  ContextMenuCommandBuilder,
  MessageFlags,
  SlashCommandBuilder,
  User,
  UserContextMenuCommandInteraction,
} from 'discord.js';
import env from '~/env';
import type { Command } from '~/types/command';

export const commands = <Array<Command>>[
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

async function helper(interaction: CommandInteraction, user: User) {
  interaction.reply({
    flags: MessageFlags.IsComponentsV2,
    components: [
      {
        type: ComponentType.Container,
        accent_color: env.EMBED_COLOR,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: `# Avatar of ${user.displayName}`,
          },
          {
            type: ComponentType.MediaGallery,
            items: [
              {
                media: {
                  url: user.displayAvatarURL({ size: 1024 }),
                },
              },
            ],
          },
          {
            type: ComponentType.TextDisplay,
            content: '> Different formats below',
          },
          {
            type: ComponentType.ActionRow,
            components: ['png', 'jpeg', 'webp', 'gif'].map((ext) => {
              return {
                type: ComponentType.Button,
                style: ButtonStyle.Link,
                label: ext.toUpperCase(),
                url: user.displayAvatarURL({
                  extension: ext as 'png' | 'jpeg' | 'webp' | 'gif',
                  size: 4096,
                }),
              };
            }),
          },
        ],
      },
    ],
  });
}
