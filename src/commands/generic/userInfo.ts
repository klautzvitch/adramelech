import {
  ApplicationCommandType,
  ChatInputCommandInteraction,
  codeBlock,
  ContextMenuCommandBuilder,
  EmbedBuilder,
  SlashCommandBuilder,
  time,
  TimestampStyles,
  UserContextMenuCommandInteraction,
  type CommandInteraction,
  type User,
} from 'discord.js';
import config from '~/config';
import type { Command } from '~/types/command';
import toUnixTimestamps from '~/utils/toUnixTimestamps';

export default <Array<Command>>[
  {
    data: new SlashCommandBuilder()
      .setName('user-info')
      .setDescription('Get information about a user')
      .addUserOption((option) =>
        option
          .setName('user')
          .setDescription('The user to get information about')
      ),
    execute: async (intr: ChatInputCommandInteraction) =>
      await helper(intr, intr.options.getUser('user') ?? intr.user),
  },
  {
    data: new ContextMenuCommandBuilder()
      .setName('User Info')
      .setType(ApplicationCommandType.User),
    execute: async (intr: UserContextMenuCommandInteraction) =>
      await helper(intr, intr.targetUser),
  },
];

async function helper(intr: CommandInteraction, user: User) {
  const member = await intr.guild?.members
    .fetch(user.id)
    .catch(() => undefined);

  const createdAt = toUnixTimestamps(user.createdTimestamp);
  const embed = new EmbedBuilder({
    color: config.embedColor,
    author: {
      name: user.username,
      icon_url: user.avatarURL() ?? undefined,
    },
    fields: [
      {
        name: '> ID',
        value: codeBlock(user.id),
        inline: true,
      },
      {
        name: '> Nickname',
        value: codeBlock(member?.nickname ?? 'None'),
        inline: true,
      },
      {
        name: '> Created At',
        value: `${time(createdAt, TimestampStyles.ShortDateTime)} (${time(
          createdAt,
          TimestampStyles.RelativeTime
        )})`,
      },
    ],
  });

  if (!member) return await intr.reply({ embeds: [embed] });

  const joinedAt = toUnixTimestamps(member.joinedTimestamp!);
  const roles = member.roles.cache.toJSON();
  const permissions = member.permissions.toArray();
  embed.addFields(
    {
      name: '> Joined At',
      value: `${time(joinedAt, TimestampStyles.ShortDateTime)} (${time(
        joinedAt,
        TimestampStyles.RelativeTime
      )})`,
    },
    {
      name: '> Roles',
      value: roles.join(', '),
    },
    {
      name: `> Permissions`,
      value: codeBlock(permissions.join(', ')),
    }
  );

  await intr.reply({ embeds: [embed] });
}
