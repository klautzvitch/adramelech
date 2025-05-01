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
import env from '~/env';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';

export default <Command>{
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member')
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('The user to kick')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('The reason for the kick')
    )
    .addBooleanOption((option) =>
      option
        .setName('ephemeral')
        .setDescription('Whether to show the response only to the executor')
    )
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(intr: ChatInputCommandInteraction) {
    const user = intr.options.getUser('user', true);
    const reason = intr.options.getString('reason') ?? 'No reason provided';
    const ephemeral = intr.options.getBoolean('ephemeral') ?? false;

    if (user.id === intr.user.id)
      return await sendError(intr, "You can't kick yourself");
    if (user.id === intr.client.user.id)
      return await sendError(intr, "You can't kick me 0w0");

    if (user.id === intr.guild?.ownerId)
      return await sendError(intr, "You can't kick the owner of the server");

    const member = intr.guild!.members.cache.get(user.id)!;
    const botMember = intr.guild!.members.cache.get(intr.client.user.id)!;
    if (
      member.roles.highest.comparePositionTo(botMember.roles.highest) >= 0 ||
      !member.kickable
    )
      return await sendError(intr, "I can't kick this user");

    try {
      await member.ban({ reason });
    } catch {
      return await sendError(intr, 'Failed to kick the user');
    }

    await intr.reply({
      embeds: [
        {
          color: env.EMBED_COLOR,
          title: 'Member Kicked',
          description: `User \`${user.tag}\` has been kicked.`,
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
            title: 'You have been kicked',
            description: `You have been kicked from \`${intr.guild!.name}\``,
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
      await sendError(intr, 'Failed to notify the user about the kick');
    }
  },
};
