import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import ky from 'ky';
import { z } from 'zod';
import config from '~/config';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';

const schema = z.object({
  name: z.string().optional(),
  message: z.string().optional(),
  type: z.string().optional(),
  cep: z.string().regex(/^\d{5}-?\d{3}$/),
  state: z.string().min(2).max(2),
  city: z.string(),
  neighborhood: z.string(),
  street: z.string(),
  service: z.string(),
  location: z.object({
    type: z.string(),
    coordinates: z.object({
      latitude: z.string().optional(),
      longitude: z.string().optional(),
    }),
  }),
});

export default <Command>{
  data: new SlashCommandBuilder()
    .setName('cep-search')
    .setDescription('Search for a CEP (Brazilian ZIP code)')
    .addStringOption((option) =>
      option
        .setName('cep')
        .setDescription('The CEP to search for')
        .setRequired(true)
    ),
  async execute(intr: ChatInputCommandInteraction) {
    await intr.deferReply();
    const cep = intr.options.getString('cep', true);

    if (!/^\d{5}-?\d{3}$/.test(cep))
      return await sendError(intr, 'Invalid CEP format');

    const response = ky
      .get(`https://brasilapi.com.br/api/cep/v2/${cep}`)
      .json();
    const { data, error } = schema.safeParse(await response);
    if (error) return await sendError(intr, 'Failed to fetch CEP data');

    if (data.name) {
      return await sendError(
        intr,
        `
        **Name:** \`${data.name}\`
        **Message:** \`${data.message}\`
        **Type:** \`${data.type}\`
        `
      );
    }

    const mapsUrl = new URL('https://www.google.com/maps/search/');
    mapsUrl.searchParams.append('api', '1');
    mapsUrl.searchParams.append(
      'query',
      !data.location.coordinates.latitude ||
        !data.location.coordinates.longitude
        ? `${data.street}, ${data.city}, ${data.state}`
        : `${data.location.coordinates.latitude},${data.location.coordinates.longitude}`
    );

    await intr.followUp({
      embeds: [
        {
          color: config.embedColor,
          title: `CEP Search`,
          fields: [
            {
              name: '> :zap: Main',
              value: `
              **CEP:** \`${data.cep}\`
              **State:** \`${data.state}\`
              **City:** \`${data.city}\`
              **Neighborhood:** \`${data.neighborhood}\`
              **Street:** \`${data.street}\`
              **Service used:** \`${data.service}\`
              `,
            },
            {
              name: '> :earth_americas: Location',
              value: `
              **Type:** \`${data.location.type}\`
              **Latitude:** \`${data.location.coordinates.latitude ?? 'N/A'}\`
              **Longitude:** \`${data.location.coordinates.longitude ?? 'N/A'}\`
              `,
            },
          ],
        },
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder({
            label: 'Open in Google Maps',
            style: ButtonStyle.Link,
            url: mapsUrl.toString(),
            emoji: '🌎',
          })
        ),
      ],
    });
  },
};
