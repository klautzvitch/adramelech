import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import ky from 'ky';
import { z } from 'zod';
import config from '~/config';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';

enum AnimeImageAgeRating {
  Safe = 'safe',
  Suggestive = 'suggestive',
  Borderline = 'borderline',
  Explicit = 'explicit',
}

const animeImageSchema = z.array(
  z.object({
    url: z.string().url(),
    source_url: z.string().nullish(),
  })
);

const nekoImageSchema = z.object({
  url: z.string().url(),
});

export default <Command>{
  data: new SlashCommandBuilder()
    .setName('anime')
    .setDescription('Anime related commands')
    .addSubcommandGroup((group) =>
      group
        .setName('media')
        .setDescription('Anime media commands')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('image')
            .setDescription('Get a random anime image')
            .addStringOption((option) =>
              option
                .setName('rating')
                .setDescription('The rating of the image')
                .setChoices(
                  Object.entries(AnimeImageAgeRating).map(([key, value]) => ({
                    name: key,
                    value,
                  }))
                )
            )
        )
        .addSubcommand((subcommand) =>
          subcommand.setName('neko').setDescription('Get a random neko image')
        )
    ),
  cooldown: true,
  uses: ['nekosapi.com', 'nekos.life'],
  async execute(intr: ChatInputCommandInteraction) {
    if (intr.options.getSubcommandGroup() === 'media') {
      switch (intr.options.getSubcommand()) {
        case 'image':
          return await animeImage(intr);
        case 'neko':
          return await nekoImage(intr);
        default:
          return await sendError(intr, 'Invalid subcommand');
      }
    }

    return await sendError(intr, 'Invalid subcommand group');
  },
};

async function animeImage(intr: ChatInputCommandInteraction) {
  await intr.deferReply();

  const rating = intr.options.getString('rating') ?? AnimeImageAgeRating.Safe;
  if (
    !Object.values(AnimeImageAgeRating).includes(rating as AnimeImageAgeRating)
  )
    return await sendError(intr, 'Invalid rating');

  if (
    !(intr.channel as TextChannel).nsfw &&
    ['borderline', 'explicit'].includes(rating)
  )
    return await sendError(
      intr,
      'This command can only be used in NSFW channels'
    );

  const response = await ky(`https://api.nekosapi.com/v4/images/random`, {
    searchParams: {
      rating,
      limit: 1,
    },
    headers: {
      'User-Agent': config.userAgent,
    },
  }).json();
  const { data, error } = animeImageSchema.safeParse(response);
  if (error) return await sendError(intr, error.message);

  let footer = '';
  if (data[0].source_url) footer = `Source: ${data[0].source_url}\n`;
  footer += `Powered by NekosAPI`;

  await intr.followUp({
    embeds: [
      {
        color: config.embedColor,
        image: { url: data[0].url },
        footer: { text: footer },
      },
    ],
  });
}

async function nekoImage(intr: ChatInputCommandInteraction) {
  await intr.deferReply();

  const response = await ky('https://nekos.life/api/v2/img/neko').json();
  const { data, error } = nekoImageSchema.safeParse(response);
  if (error) return await sendError(intr, error.message);

  await intr.followUp({
    embeds: [
      {
        color: config.embedColor,
        image: { url: data.url },
        footer: { text: 'Powered by nekos.life' },
      },
    ],
  });
}
