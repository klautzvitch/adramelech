import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  codeBlock,
  SlashCommandBuilder,
  time,
  TimestampStyles,
} from 'discord.js';
import type { CustomClient } from '~';
import env from '~/env';
import type { Command } from '~/types/command';

export default <Command>{
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('About the bot'),
  async execute(intr) {
    const client = intr.client as CustomClient;
    const info = await client.application?.fetch();
    const owner = await client.users.fetch(info!.owner!.id);

    await intr.reply({
      embeds: [
        {
          color: env.EMBED_COLOR,
          author: {
            name: owner.username,
            icon_url: owner.avatarURL() ?? undefined,
          },
          title: 'About',
          fields: [
            {
              name: '> Commands',
              value: `Currently, there are \`${client.commands.size}\` commands available.`,
            },
            {
              name: '> Running on',
              value: `Bun ${Bun.version} on ${process.platform} ${process.arch}`,
            },
            {
              name: '> Uptime',
              value: time(
                Math.floor(Date.now() / 1000 - process.uptime()),
                TimestampStyles.RelativeTime
              ),
            },
            {
              name: '> Memory Usage',
              value: codeBlock(
                `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(
                  2
                )} MB`
              ),
            },
            {
              name: '> Guilds',
              value: codeBlock(client.guilds.cache.size.toString()),
            },
            {
              name: '> Users',
              value: codeBlock(client.users.cache.size.toString()),
            },
          ],
          footer: {
            text: 'Made with ❤️ using discord.js in 🇧🇷',
            icon_url: 'https://avatars.githubusercontent.com/u/26492485',
          },
        },
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder({
            label: 'Author',
            style: ButtonStyle.Link,
            url: env.AUTHOR_URL,
          }),
          new ButtonBuilder({
            label: 'Repository',
            style: ButtonStyle.Link,
            url: env.REPOSITORY_URL,
          })
        ),
      ],
    });
  },
};
