import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from 'discord.js';
import ky from 'ky';
import v from 'voca';
import { z } from 'zod';
import type { Result } from '~/common/result';
import env from '~/env';
import type { Command } from '~/types/command';
import { sendError } from '~/utils/sendError';

const BASE_URL = 'https://api.github.com';

const repositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  html_url: z.string().url(),
  description: z.string().nullish(),
  fork: z.boolean(),
  language: z.string(),
  stargazers_count: z.number(),
  watchers_count: z.number(),
  forks_count: z.number(),
  owner: z.object({
    id: z.number(),
    login: z.string(),
    type: z.string(),
    avatar_url: z.string().url(),
  }),
  license: z
    .object({
      key: z.string(),
    })
    .nullish(),
});

const licenseSchema = z.object({
  name: z.string(),
  permissions: z.array(z.string()),
  conditions: z.array(z.string()),
  limitations: z.array(z.string()),
});

const userSchema = z.object({
  id: z.number(),
  login: z.string(),
  type: z.string(),
  name: z.string().nullish(),
  company: z.string().nullish(),
  blog: z.string().nullish(),
  location: z.string().nullish(),
  bio: z.string().nullish(),
  public_repos: z.number(),
  public_gists: z.number(),
  followers: z.number(),
  following: z.number(),
  avatar_url: z.string().url(),
  html_url: z.string().url(),
});

const socialsSchema = z.array(
  z.object({
    provider: z.string().transform((value) => v.titleCase(value)),
    url: z.string().url(),
  })
);
type Socials = z.infer<typeof socialsSchema>;

export default <Command>{
  data: new SlashCommandBuilder()
    .setName('github')
    .setDescription('Get Github information')
    .addSubcommand((subCommand) =>
      subCommand
        .setName('repo')
        .setDescription('Get information about a repository')
        .addStringOption((option) =>
          option
            .setName('user')
            .setDescription('The user or organization name')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('repo')
            .setDescription('The repository name')
            .setRequired(true)
        )
    )
    .addSubcommand((subCommand) =>
      subCommand
        .setName('user')
        .setDescription('Get information about a user')
        .addStringOption((option) =>
          option
            .setName('user')
            .setDescription('The user name')
            .setRequired(true)
        )
    ),
  uses: ['GitHub API'],
  cooldown: true,
  async execute(intr: ChatInputCommandInteraction) {
    await intr.deferReply();

    switch (intr.options.getSubcommand()) {
      case 'repo':
        await repo(intr);
        break;
      case 'user':
        await user(intr);
        break;
      default:
        await sendError(intr, 'Invalid subcommand');
        break;
    }
  },
};

async function repo(intr: ChatInputCommandInteraction) {
  const user = intr.options.getString('user', true);
  const repo = intr.options.getString('repo', true);

  const response = await fetchGitHubData(
    `/repos/${user}/${repo}`,
    repositorySchema
  );
  if (response.error)
    return await sendError(intr, 'Failed to get repository data');
  const data = response.data;

  let licenseField = 'No License';
  if (data.license) {
    if (data.license.key === 'other') licenseField = 'Other';
    else {
      const license = await getLicense(data.license.key);
      if (license.error) return await sendError(intr, 'Failed to get license');
      licenseField = license.data;
    }
  }

  await intr.followUp({
    embeds: [
      {
        color: env.EMBED_COLOR,
        title: 'Repository Information',
        thumbnail: { url: data.owner.avatar_url },
        fields: [
          {
            name: '> :zap: Main',
            value: `
            **Name:** ${data.name}
            **ID:** ${data.id}
            **Description:** ${data.description ?? 'N/A'}
            **Fork:** ${data.fork ? 'Yes' : 'No'}
            **Main Language:** ${data.language}
            **Stars:** ${data.stargazers_count}
            **Watchers:** ${data.watchers_count}
            **Forks:** ${data.forks_count}
            `,
          },
          {
            name: '> :bust_in_silhouette: Owner',
            value: `
            **Username:** ${data.owner.login}
            **ID:** ${data.owner.id}
            **Type:** ${data.owner.type}
            `,
          },
          {
            name: '> :scroll: License',
            value: licenseField,
          },
        ],
        footer: {
          text: 'Powered by GitHub API',
        },
      },
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder({
          label: 'Repository',
          url: data.html_url,
          style: ButtonStyle.Link,
        }),
        new ButtonBuilder({
          label: 'Owner',
          url: `https://github.com/${data.owner.login}`,
          style: ButtonStyle.Link,
        })
      ),
    ],
  });
}

async function user(intr: ChatInputCommandInteraction) {
  const user = intr.options.getString('user', true);

  const response = await fetchGitHubData(`/users/${user}`, userSchema);
  if (response.error) return await sendError(intr, 'Failed to get user data');
  const data = response.data;

  const rawSocials = await getSocials(user);
  if (rawSocials.error) return await sendError(intr, 'Failed to get socials');

  const [socials, socialField] = rawSocials.data;

  const components = new ActionRowBuilder<ButtonBuilder>();
  components.addComponents(
    new ButtonBuilder({
      label: 'Profile',
      url: data.html_url,
      style: ButtonStyle.Link,
    })
  );
  if (!v.isEmpty(data.blog ?? undefined))
    components.addComponents(
      new ButtonBuilder({
        label: 'Website',
        url: `https://${data.blog}`,
        style: ButtonStyle.Link,
      })
    );
  socials.forEach((social) =>
    components.addComponents(
      new ButtonBuilder({
        label: social.provider,
        url: social.url,
        style: ButtonStyle.Link,
      })
    )
  );

  await intr.followUp({
    embeds: [
      {
        color: env.EMBED_COLOR,
        title: 'User Information',
        thumbnail: { url: data.avatar_url },
        fields: [
          {
            name: '> :zap: Main',
            value: `
            **Username:** ${data.login}
            **ID:** ${data.id}
            **Type:** ${data.type}
            **Name:** ${data.name ?? 'N/A'}
            **Company:** ${data.company ?? 'N/A'}
            **Website:** ${data.blog ?? 'N/A'}
            **Location:** ${data.location ?? 'N/A'}
            **Bio:** ${data.bio ?? 'N/A'}
            `,
          },
          {
            name: '> :bar_chart: Stats',
            value: `
            **Public Repos:** ${data.public_repos}
            **Public Gists:** ${data.public_gists}
            **Followers:** ${data.followers}
            **Following:** ${data.following}
            `,
          },
          {
            name: '> :link: Socials',
            value: socialField,
          },
        ],
        footer: {
          text: 'Powered by GitHub API',
        },
      },
    ],
    components: [components],
  });
}

async function getLicense(key: string): Promise<Result<string>> {
  const result = await fetchGitHubData(`/licenses/${key}`, licenseSchema);
  if (result.error) return result;

  const { name, permissions, conditions, limitations } = result.data;
  return {
    data: `
    **Name:** ${v.titleCase(name)}
    **Permissions:** ${v.titleCase(permissions.join(', '))}
    **Conditions:** ${v.titleCase(conditions.join(', '))}
    **Limitations:** ${v.titleCase(limitations.join(', '))}
    `,
  };
}

async function getSocials(user: string): Promise<Result<[Socials, string]>> {
  const result = await fetchGitHubData(
    `/users/${user}/social_accounts`,
    socialsSchema
  );
  if (result.error) return result;
  const socials = result.data;

  const socialField = socials
    .map((social) => {
      return `**${social.provider}:** ${social.url}`;
    })
    .join('\n');

  return { data: [socials, socialField] };
}

async function fetchGitHubData<T>(
  endpoint: string,
  schema: z.ZodSchema<T>
): Promise<Result<T>> {
  try {
    const response = await ky
      .get(`${BASE_URL}${endpoint}`, {
        headers: { 'User-Agent': env.USER_AGENT },
      })
      .json();
    const result = schema.safeParse(response);
    if (!result.success) return { error: Error('Failed to parse response') };
    return { data: result.data };
  } catch (error) {
    return { error: error instanceof Error ? error : Error('Unknown error') };
  }
}
