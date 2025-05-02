import {
  ChatInputCommandInteraction,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import ky from 'ky';
import { z } from 'zod';
import env from '~/env';
import StringBuilder from '~/tools/StringBuilder';
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
    const group = commands[intr.options.getSubcommandGroup() ?? ''];
    if (!group) return await sendError(intr, 'Invalid subcommand group');

    const command = group[intr.options.getSubcommand()];
    if (!command) return await sendError(intr, 'Invalid subcommand');

    await command(intr);
  },
};

const commands: Record<
  string,
  Record<string, (intr: ChatInputCommandInteraction) => Promise<void>>
> = {
  media: {
    image: animeImage,
    neko: nekoImage,
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

  const response = await ky('https://api.nekosapi.com/v4/images/random', {
    searchParams: {
      rating,
      limit: 1,
    },
    headers: {
      'User-Agent': env.USER_AGENT,
    },
  }).json();
  const { data, error } = animeImageSchema.safeParse(response);
  if (error) return await sendError(intr, error.message);

  const footer = new StringBuilder();
  if (data[0].source_url) footer.appendLine(`> Source: ${data[0].source_url}`);
  footer.append(`> Powered by NekosAPI`);

  await intr.followUp({
    flags: MessageFlags.IsComponentsV2,
    components: [
      {
        type: ComponentType.Container,
        accent_color: env.EMBED_COLOR,
        components: [
          {
            type: ComponentType.MediaGallery,
            items: [
              {
                media: {
                  url: data[0].url,
                },
              },
            ],
          },
          {
            type: ComponentType.TextDisplay,
            content: footer.toString(),
          },
        ],
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
    flags: MessageFlags.IsComponentsV2,
    components: [
      {
        type: ComponentType.Container,
        accent_color: env.EMBED_COLOR,
        components: [
          {
            type: ComponentType.MediaGallery,
            items: [
              {
                media: {
                  url: data.url,
                },
              },
            ],
          },
          {
            type: ComponentType.TextDisplay,
            content: '> Powered by nekos.life',
          },
        ],
      },
    ],
  });
}
