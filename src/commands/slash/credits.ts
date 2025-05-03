import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import type { CustomClient } from '~';
import env from '~/env';
import UnicodeSheet from '~/tools/UnicodeSheet';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';

export default <Command>{
  data: new SlashCommandBuilder()
    .setName('credits')
    .setDescription('List of all external APIs used by the bot')
    .addBooleanOption((option) =>
      option
        .setName('separate-rows')
        .setDescription('Whether to separate the APIs into individual rows')
    ),
  async execute(intr: ChatInputCommandInteraction) {
    await intr.deferReply();

    const separateRows = intr.options.getBoolean('separate-rows') ?? false;
    const client = intr.client as CustomClient;

    const credits = client.commands
      .filter((cmd) => cmd.uses && cmd.uses.length > 0)
      .map((cmd) => {
        return {
          name: cmd.data.name,
          uses: cmd.uses!.join('; '),
        };
      });

    let content: string;
    try {
      content = new UnicodeSheet(separateRows)
        .addColumn(
          'Command',
          credits.map((cmd) => cmd.name)
        )
        .addColumn(
          'Uses',
          credits.map((cmd) => cmd.uses)
        )
        .build();
    } catch {
      return await sendError(intr, 'Failed to build the credits table');
    }

    await intr.followUp({
      flags: MessageFlags.IsComponentsV2,
      components: [
        {
          type: ComponentType.Container,
          accent_color: env.EMBED_COLOR,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: '# Credits',
            },
            {
              type: ComponentType.File,
              file: {
                url: 'attachment://credits.txt',
              },
            },
          ],
        },
      ],
      files: [
        new AttachmentBuilder(Buffer.from(content), {
          name: 'credits.txt',
        }),
      ],
    });
  },
};
