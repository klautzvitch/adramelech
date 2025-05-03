import { stripIndents } from 'common-tags';
import {
  ChatInputCommandInteraction,
  Colors,
  ComponentType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  userMention,
} from 'discord.js';
import env from '~/env';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';

export const command = <Command>{
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
      return await sendError(intr, "You can't ban me UwU");

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
      flags: ephemeral
        ? [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2]
        : MessageFlags.IsComponentsV2,
      components: [
        {
          type: ComponentType.Container,
          accent_color: env.EMBED_COLOR,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: stripIndents`
              # Member Banned
              User \`${user.username}\` has been banned
              ### :warning: Reason
              \`\`\`${reason}\`\`\`
              `,
            },
            {
              type: ComponentType.TextDisplay,
              content: stripIndents`
              ### :shield: Author
              ${userMention(intr.user.id)}
              `,
            },
          ],
        },
      ],
    });

    try {
      await user.send({
        flags: MessageFlags.IsComponentsV2,
        components: [
          {
            type: ComponentType.Container,
            accent_color: Colors.Red,
            components: [
              {
                type: ComponentType.TextDisplay,
                content: stripIndents`
                # You have been banned
                ### Guild
                \`\`\`${intr.guild!.name}\`\`\`
                `,
              },
              {
                type: ComponentType.TextDisplay,
                content: stripIndents`
                ### Reason
                \`\`\`${reason}\`\`\`
                `,
              },
            ],
          },
        ],
      });
    } catch {
      await sendError(intr, 'Failed to notify the user about the ban');
    }
  },
};
