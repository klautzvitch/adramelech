import {
  ChatInputCommandInteraction,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
  time,
  TimestampStyles,
} from 'discord.js';
import config from '~/config';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';

export default {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clears the chat')
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addNumberOption((option) =>
      option
        .setName('amount')
        .setDescription('The amount of messages to clear')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .addNumberOption((option) =>
      option
        .setName('seconds_before_auto_delete')
        .setDescription(
          'The amount of seconds before the bot response is auto-deleted'
        )
        .setMinValue(0)
        .setMaxValue(10)
    ),
  async execute(intr: ChatInputCommandInteraction) {
    await intr.deferReply();

    const amount = intr.options.getNumber('amount')!;
    const secondsBeforeAutoDelete =
      intr.options.getNumber('seconds_before_auto_delete') ?? 0;

    const messages = (await intr.channel!.messages.fetch({ limit: amount }))
      .toJSON()
      .filter((msg) => Date.now() - msg.createdTimestamp < 1209600000) // 14 days
      .slice(1) // Skip the command message
      .map((msg) => msg.id);

    if (!messages?.length)
      return await sendError(intr, 'No messages found to delete', {
        deferred: true,
      });

    let deleted: number;
    try {
      deleted = (await (intr.channel as TextChannel).bulkDelete(messages, true))
        .size;
    } catch (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: any
    ) {
      return await sendError(intr, error.message, { deferred: true });
    }

    await intr.followUp({
      embeds: [
        {
          color: config.embedColor,
          description: `
          Successfully cleared ${deleted} messages
          Command executed by ${intr.user}
          ${
            secondsBeforeAutoDelete
              ? `This message will be auto-deleted ${time(
                  Math.floor(Date.now() / 1000) + secondsBeforeAutoDelete,
                  TimestampStyles.RelativeTime
                )}`
              : ''
          }
        `,
        },
      ],
    });

    if (!secondsBeforeAutoDelete) return;

    setTimeout(async () => {
      try {
        await intr.deleteReply();
      } catch {
        // Do nothing
      }
    }, secondsBeforeAutoDelete * 1000);
  },
} as Command;
