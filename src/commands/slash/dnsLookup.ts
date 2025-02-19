import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import ky from 'ky';
import config from '~/config';
import UnicodeSheet from '~/tools/UnicodeSheet';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';

type DnsRecord = {
  type: string;
  revalidateIn: string;
  content: string;
};

export default <Command>{
  data: new SlashCommandBuilder()
    .setName('dns-lookup')
    .setDescription("Lookup a domain's DNS records")
    .addStringOption((option) =>
      option
        .setName('domain')
        .setDescription('The domain to lookup')
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName('separate-rows')
        .setDescription('Whether to separate the records into individual rows')
    ),
  uses: ['da.gd'],
  async execute(intr: ChatInputCommandInteraction) {
    await intr.deferReply();

    const domain = intr.options.getString('domain', true);
    const separateRows = intr.options.getBoolean('separate-rows') ?? false;

    const response = await ky.get(`https://da.gd/dns/${domain}`).text();
    const records = parseResponse(response);

    if (records.length === 0)
      return await sendError(intr, 'No DNS records found for this domain');

    let content: string;
    try {
      content = new UnicodeSheet(separateRows)
        .addColumn(
          'Type',
          records.map((record) => record.type)
        )
        .addColumn(
          'Revalidate In',
          records.map((record) => record.revalidateIn)
        )
        .addColumn(
          'Content',
          records.map((record) => record.content)
        )
        .build();
    } catch {
      return await sendError(intr, 'Failed to build the Unicode sheet');
    }

    await intr.followUp({
      embeds: [
        {
          color: config.embedColor,
          title: 'DNS Lookup',
          description: `DNS records for \`${domain}\``,
          footer: {
            text: 'Powered by da.gd',
          },
        },
      ],
      files: [
        new AttachmentBuilder(Buffer.from(content), {
          name: 'records.txt',
        }),
      ],
    });
  },
};

function parseResponse(text: string): DnsRecord[] {
  return text
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => line.split(' '))
    .filter((parts) => parts.length >= 5)
    .map((parts) => ({
      type: parts[3],
      revalidateIn: parts[1],
      content: parts.slice(4).join(' ').trimEnd(),
    }));
}
