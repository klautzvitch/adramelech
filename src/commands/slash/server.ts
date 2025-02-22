import {
  codeBlock,
  InteractionContextType,
  SlashCommandBuilder,
  time,
  TimestampStyles,
} from 'discord.js';
import config from '~/config';
import type { Command } from '~/types/command';
import toUnixTimestamps from '~/utils/toUnixTimestamps';

export default <Command>{
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('Replies with server info!')
    .setContexts(InteractionContextType.Guild),
  async execute(intr) {
    const owner = await intr.guild!.fetchOwner();
    const createdAt = toUnixTimestamps(intr.guild!.createdTimestamp);

    await intr.reply({
      embeds: [
        {
          color: config.embedColor,
          author: {
            name: intr.guild!.name,
            icon_url: intr.guild!.iconURL() ?? undefined,
          },
          fields: [
            {
              name: '> Owner',
              value: codeBlock(`${owner.user.tag} (${owner.id})`),
            },
            {
              name: '> ID',
              value: codeBlock(intr.guild!.id),
              inline: true,
            },
            {
              name: '> Members',
              value: codeBlock(intr.guild!.memberCount.toString()),
              inline: true,
            },
            {
              name: '> Roles',
              value: codeBlock(intr.guild!.roles.cache.size.toString()),
              inline: true,
            },
            {
              name: '> Channels',
              value: codeBlock(intr.guild!.channels.cache.size.toString()),
              inline: true,
            },
            {
              name: '> Boosts',
              value: codeBlock(
                `${intr.guild!.premiumSubscriptionCount} Boosts${
                  intr.guild!.premiumTier > 0
                    ? ` ${intr.guild!.premiumTier}`
                    : ''
                }`
              ),
              inline: true,
            },
            {
              name: '> Created At',
              value: `${time(createdAt, TimestampStyles.LongDateTime)} (${time(
                createdAt,
                TimestampStyles.RelativeTime
              )})`,
            },
          ],
        },
      ],
    });
  },
};
