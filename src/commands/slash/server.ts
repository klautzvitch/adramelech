import { stripIndents } from 'common-tags';
import {
  AttachmentBuilder,
  ComponentType,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
  time,
  TimestampStyles,
} from 'discord.js';
import env from '~/env';
import type { Command } from '~/types/command';
import toUnixTimestamps from '~/utils/toUnixTimestamps';

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('Replies with server info!')
    .setContexts(InteractionContextType.Guild),
  async execute(intr) {
    const owner = await intr.guild!.fetchOwner();
    const createdAt = toUnixTimestamps(intr.guild!.createdTimestamp);

    await intr.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [
        {
          type: ComponentType.Container,
          accent_color: env.EMBED_COLOR,
          components: [
            {
              type: ComponentType.Section,
              components: [
                {
                  type: ComponentType.TextDisplay,
                  content: stripIndents`
                  # ${intr.guild!.name}
                  ### **Owner**
                  \`${owner.user.tag}\` (\`${owner.id}\`)
                  ### **ID**
                  \`${intr.guild!.id}\`
                  ### **Members**
                  \`${intr.guild!.memberCount.toString()}\`
                  ### **Roles**
                  \`${intr.guild!.roles.cache.size.toString()}\`
                  ### **Channels**
                  \`${intr.guild!.channels.cache.size.toString()}\`
                  ### **Boosts**
                  \`${intr.guild!.premiumSubscriptionCount} Boosts${
                    intr.guild!.premiumTier > 0
                      ? ` ${intr.guild!.premiumTier}`
                      : ''
                  }\`
                  ### **Created At**
                  ${time(createdAt, TimestampStyles.LongDateTime)} (${time(
                    createdAt,
                    TimestampStyles.RelativeTime
                  )})
                  ### Download the raw guild data below
                  `,
                },
              ],
              accessory: {
                type: ComponentType.Thumbnail,
                media: {
                  url: intr.guild!.iconURL()!,
                },
              },
            },
            {
              type: ComponentType.File,
              file: {
                url: 'attachment://guild.json',
              },
            },
          ],
        },
      ],
      files: [
        new AttachmentBuilder(
          Buffer.from(JSON.stringify(intr.guild?.toJSON(), null, 2)),
          { name: 'guild.json' }
        ),
      ],
    });
  },
};
