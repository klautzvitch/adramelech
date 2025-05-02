import {
  ChatInputCommandInteraction,
  ComponentType,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
  time,
  TimestampStyles,
} from 'discord.js';
import env from '~/env';
import StringBuilder from '~/tools/StringBuilder';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';

export default <Command>{
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
        .setName('seconds-before-auto-delete')
        .setDescription(
          'The amount of seconds before the bot response is auto-deleted'
        )
        .setMinValue(0)
        .setMaxValue(10)
    ),
  async execute(intr: ChatInputCommandInteraction) {
    await intr.deferReply();

    const amount = intr.options.getNumber('amount', true);
    const secondsBeforeAutoDelete =
      intr.options.getNumber('seconds-before-auto-delete') ?? 0;

    const messages = (
      await intr.channel!.messages.fetch({
        limit: amount === 100 ? amount : amount + 1, // Compensate for the command message
      })
    )
      .toJSON()
      .filter((msg) => Date.now() - msg.createdTimestamp < 1209600000) // 14 days
      .slice(1) // Skip the command message
      .map((msg) => msg.id);

    if (!messages?.length)
      return await sendError(intr, 'No messages found to delete');

    let deleted: number;
    try {
      deleted = (await (intr.channel as TextChannel).bulkDelete(messages, true))
        .size;
    } catch (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error: any
    ) {
      return await sendError(intr, error.message);
    }

    const message = new StringBuilder();
    message.appendLine(`# Successfully cleared ${deleted} messages`);
    if (secondsBeforeAutoDelete)
      message.appendLine(
        `### This message will be auto-deleted ${time(
          Math.floor(Date.now() / 1000) + secondsBeforeAutoDelete,
          TimestampStyles.RelativeTime
        )}`
      );
    message.appendLine(`> Command executed by ${intr.user}`);

    await intr.followUp({
      flags: MessageFlags.IsComponentsV2,
      components: [
        {
          type: ComponentType.Container,
          accent_color: env.EMBED_COLOR,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: message.toString(),
            },
          ],
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
};
