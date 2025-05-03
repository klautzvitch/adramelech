import {
  ChatInputCommandInteraction,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import env from '~/env';
import type { Command } from '~/types/command';

export const command = <Command>{
  data: new SlashCommandBuilder()
    .setName('dice')
    .setDescription('Roll a dice')
    .addIntegerOption((option) =>
      option
        .setName('sides')
        .setDescription('Number of sides')
        .setMinValue(2)
        .setMaxValue(100)
    ),
  async execute(intr: ChatInputCommandInteraction) {
    const sides = intr.options.getInteger('sides') ?? 6;
    const result = Math.floor(Math.random() * sides) + 1;

    await intr.reply({
      flags: MessageFlags.IsComponentsV2,
      components: [
        {
          type: ComponentType.Container,
          accent_color: env.EMBED_COLOR,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: `# You rolled a ${result} on a ${sides}-sided dice\n`,
            },
          ],
        },
      ],
    });
  },
};
