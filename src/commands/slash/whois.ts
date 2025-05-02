import { stripIndents } from 'common-tags';
import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  ComponentType,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import ky from 'ky';
import env from '~/env';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';

const badResponses = [
  'Malformed',
  'Wrong',
  'The queried object does not',
  'Invalid',
  'No match',
  'Domain not',
  'NOT FOUND',
  'Did not get',
];

export default <Command>{
  data: new SlashCommandBuilder()
    .setName('whois')
    .setDescription('Get information about a domain or IP address')
    .addStringOption((option) =>
      option
        .setName('target')
        .setDescription('The domain or IP address to get information about')
        .setRequired(true)
    ),
  cooldown: true,
  uses: ['da.gd'],
  async execute(intr: ChatInputCommandInteraction) {
    await intr.deferReply();

    const target = intr.options.getString('target', true);

    const response = await ky(`https://da.gd/w/${target}`).text();
    if (!response.trim() || badResponses.some((r) => response.startsWith(r)))
      return await sendError(intr, 'Invalid domain or IP address');

    await intr.followUp({
      flags: MessageFlags.IsComponentsV2,
      components: [
        {
          type: ComponentType.Container,
          accent_color: env.EMBED_COLOR,
          components: [
            {
              type: ComponentType.TextDisplay,
              content: stripIndents`
              # Whois Lookup
              ### :mag: Target
              \`\`\`${target}\`\`\`
              `,
            },
            {
              type: ComponentType.TextDisplay,
              content: '### :page_with_curl: Response',
            },
            {
              type: ComponentType.File,
              file: {
                url: 'attachment://whois.txt',
              },
            },
            {
              type: ComponentType.TextDisplay,
              content: '> Powered by da.gd',
            },
          ],
        },
      ],
      files: [
        new AttachmentBuilder(Buffer.from(response), {
          name: 'whois.txt',
        }),
      ],
    });
  },
};
