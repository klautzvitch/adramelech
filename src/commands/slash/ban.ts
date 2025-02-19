import {
  ChatInputCommandInteraction,
  codeBlock,
  Colors,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  userMention,
} from 'discord.js';
import config from '~/config';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';

export default <Command>{
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member')
    .addUserOption((option) =>
      option.setName('user').setDescription('The user to ban').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('The reason for the ban')
    )
    .addIntegerOption((option) =>
      option
        .setName('prune-days')
        .setDescription('The number of days to prune messages')
    )
    .addBooleanOption((option) =>
      option
        .setName('ephemeral')
        .setDescription('Whether to show the response only to the executor')
    )
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(intr: ChatInputCommandInteraction) {
    const user = intr.options.getUser('user', true);
    const reason = intr.options.getString('reason') ?? 'No reason provided';
    const pruneDays = intr.options.getInteger('prune-days') ?? 0;
    const ephemeral = intr.options.getBoolean('ephemeral') ?? false;

    if (user.id === intr.user.id)
      return await sendError(intr, "You can't ban yourself");
    if (user.id === intr.client.user.id)
      return await sendError(intr, "You can't ban me 0w0");

    if (user.id === intr.guild?.ownerId)
      return await sendError(intr, "You can't ban the owner of the server");

    const member = intr.guild!.members.cache.get(user.id)!;
    const botMember = intr.guild!.members.cache.get(intr.client.user.id)!;
    if (
      member.roles.highest.comparePositionTo(botMember.roles.highest) >= 0 ||
      !member.bannable
    )
      return await sendError(intr, "I can't ban this user");

    try {
      await member.ban({
        reason,
        deleteMessageDays: pruneDays,
      });
    } catch {
      return await sendError(intr, 'An error occurred while banning the user');
    }

    await intr.reply({
      embeds: [
        {
          color: config.embedColor,
          title: 'Member Banned',
          description: `User \`${user.username}\` has been banned`,
          fields: [
            {
              name: '> Reason',
              value: codeBlock(reason),
            },
            {
              name: '> Author',
              value: userMention(intr.user.id),
            },
          ],
        },
      ],
      flags: ephemeral ? MessageFlags.Ephemeral : undefined,
    });

    try {
      await user.send({
        embeds: [
          {
            color: Colors.Red,
            title: 'You have been banned',
            description: `You have been banned from \`${intr.guild!.name}\``,
            fields: [
              {
                name: '> Reason',
                value: codeBlock(reason),
              },
            ],
          },
        ],
      });
    } catch {
      await sendError(intr, 'Failed to notify the user');
    }
  },
};
