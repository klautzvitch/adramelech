import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import config from '~/config';
import type { Command } from '~/types/command';

export default <Command>{
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
      embeds: [
        {
          color: config.embedColor,
          title: `Dice Roll`,
          description: `You rolled a ${result} on a ${sides}-sided dice`,
        },
      ],
    });
  },
};
