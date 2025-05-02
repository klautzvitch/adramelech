/*
"""
Notice
As of 2025-03-23, owo.vc is end of life.

Due to abuse and overwhelming amounts of spam. It became no longer feasible to continue running the service for the small amount of legitimate users that exist. Unfortunately, several parties have been persistently attacking and abusing the provided service, making it impractical and impossible to properly moderate and monitor the normal usage of owo.vc.

Effective immediately, links will no longer be able to be shortened via owo.vc. This is not a choice that has been made lightly, but it is one that will prevent additional abuse. Existing links will not be impacted, and will continue to function as intended for the foreseeable future.

If there are any questions or concerns, feel free to open an issue on the project's GitHub repository.

Thank you to all those who enjoyed using owo.vc. I appreciate seeing the different ways that it has been used over the last several years.
"""
*/

// import { stripIndents } from 'common-tags';
// import {
//   ChatInputCommandInteraction,
//   ComponentType,
//   MessageFlags,
//   SlashCommandBuilder,
//   time,
// } from 'discord.js';
// import ky from 'ky';
// import { z } from 'zod';
// import env from '~/env';
// import type { Command } from '~/types/command';
// import { sendError } from '~/utils/sendError';
// import toUnixTimestamps from '~/utils/toUnixTimestamps';

// const schema = z.object({
//   id: z.string(),
//   destination: z.string(),
//   method: z.union([
//     z.literal('SKETCHY'),
//     z.literal('OWO'),
//     z.literal('GAY'),
//     z.literal('ZWS'),
//   ]),
//   metadata: z.union([
//     z.literal('IGNORE'),
//     z.literal('PROXY'),
//     z.literal('OWOIFY'),
//   ]),
//   createdAt: z
//     .string()
//     .datetime()
//     .transform((date) => toUnixTimestamps(new Date(date).getTime())),
// });

// export default <Command>{
//   data: new SlashCommandBuilder()
//     .setName('obfuscate')
//     .setDescription('Obfuscate a URL')
//     .addStringOption((option) =>
//       option
//         .setName('url')
//         .setDescription('The URL to obfuscate')
//         .setRequired(true)
//     )
//     .addStringOption((option) =>
//       option
//         .setName('generator')
//         .setDescription('The generator to use (default: sketchy)')
//         .addChoices(
//           {
//             name: 'Sketchy',
//             value: 'sketchy',
//           },
//           {
//             name: 'OwO',
//             value: 'owo',
//           },
//           {
//             name: 'Gay',
//             value: 'gay',
//           },
//           {
//             name: 'Zero Width Space',
//             value: 'zws',
//           }
//         )
//     )
//     .addStringOption((option) =>
//       option
//         .setName('metadata')
//         .setDescription('What to do with metadata (default: proxy)')
//         .addChoices(
//           {
//             name: 'Ignore',
//             value: 'IGNORE',
//           },
//           {
//             name: 'Proxy',
//             value: 'PROXY',
//           },
//           {
//             name: 'OwOify',
//             value: 'OWOIFY',
//           }
//         )
//     ),
//   cooldown: true,
//   uses: ['owo.vc'],
//   async execute(intr: ChatInputCommandInteraction) {
//     await intr.deferReply();

//     const url = intr.options.getString('url', true);
//     const generator = intr.options.getString('generator') ?? 'sketchy';
//     const metadata = intr.options.getString('metadata') ?? 'PROXY';

//     const match = z.string().url().safeParse(url);
//     if (!match.success) return await sendError(intr, 'Invalid URL provided');

//     const response = await ky
//       .post('https://owo.vc/api/v2/link', {
//         json: {
//           link: url,
//           generator,
//           metadata,
//         },
//         headers: {
//           'User-Agent': env.USER_AGENT,
//         },
//       })
//       .json();
//     const { data, error } = schema.safeParse(response);
//     if (error) return await sendError(intr, 'Failed to parse response');

//     await intr.followUp({
//       flags: MessageFlags.IsComponentsV2,
//       components: [
//         {
//           type: ComponentType.Container,
//           accentColor: env.EMBED_COLOR,
//           components: [
//             {
//               type: ComponentType.TextDisplay,
//               content: stripIndents`
//                 # Obfuscated URL

//                 > :outbox_tray: **Original URL**
//                 \`\`\`${data.destination}\`\`\`
//                 > :inbox_tray: **Obfuscated URL**
//                 \`\`\`${data.id}\`\`\`
//                 > :wrench: **Method**
//                 \`\`\`${data.method}\`\`\`
//                 > :information_source: **Metadata**
//                 \`\`\`${data.metadata}\`\`\`
//                 > :clock1: **Created At**
//                 ${time(data.createdAt)}
//               `,
//             },
//           ],
//         },
//       ],
//     });
//   },
// };
