import { stripIndents } from 'common-tags';
import {
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  ContainerBuilder,
  MessageFlags,
  SlashCommandBuilder,
  type APIComponentInMessageActionRow,
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
  language: z.string().nullish(),
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
  html_url: z.string().url(),
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

  let license:
    | {
        content: string;
        html_url?: string;
      }
    | undefined;
  if (data.license) {
    if (data.license.key === 'other') license = { content: 'Other' };
    else {
      const rawLicense = await getLicense(data.license.key);
      if (rawLicense.error)
        return await sendError(intr, 'Failed to get license');
      license = rawLicense.data;
    }
  }

  const container = new ContainerBuilder({
    accent_color: env.EMBED_COLOR,
    components: [
      {
        type: ComponentType.TextDisplay,
        content: '# Repository Information',
      },
      {
        type: ComponentType.TextDisplay,
        content: stripIndents`
        **Name:** \`${data.name}\`
        **ID:** ${data.id}
        **Description:** \`${data.description ?? 'N/A'}\`
        **Fork:** ${data.fork ? 'Yes' : 'No'}
        **Main Language:** ${data.language}
        **Stars:** ${data.stargazers_count}
        **Watchers:** ${data.watchers_count}
        **Forks:** ${data.forks_count}
        `,
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Link,
            label: 'Repository',
            url: data.html_url,
          },
        ],
      },
      { type: ComponentType.Separator },
      {
        type: ComponentType.Section,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: stripIndents`
            ## Owner
            **Username:** \`${data.owner.login}\`
            **ID:** ${data.owner.id}
            **Type:** ${data.owner.type}
            `,
          },
        ],
        accessory: {
          type: ComponentType.Thumbnail,
          media: {
            url: data.owner.avatar_url,
          },
        },
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Link,
            label: 'Github Profile',
            url: `https://github.com/${data.owner.login}`,
          },
        ],
      },
    ],
  });

  if (license) {
    container.addSeparatorComponents({ type: ComponentType.Separator });
    container.addTextDisplayComponents({
      type: ComponentType.TextDisplay,
      content: stripIndents`
      ## License
      ${license.content}
      `,
    });
    if (license.html_url) {
      container.addActionRowComponents({
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            style: ButtonStyle.Link,
            label: 'License Page',
            url: license.html_url,
          },
        ],
      });
    }
  }

  container.addTextDisplayComponents({
    type: ComponentType.TextDisplay,
    content: '> Powered by GitHub API',
  });

  await intr.followUp({
    flags: MessageFlags.IsComponentsV2,
    components: [container],
  });
}

async function user(intr: ChatInputCommandInteraction) {
  const user = intr.options.getString('user', true);

  const response = await fetchGitHubData(`/users/${user}`, userSchema);
  if (response.error) return await sendError(intr, 'Failed to get user data');
  const data = response.data;

  const rawSocials = await getSocials(user);
  if (rawSocials.error) return await sendError(intr, 'Failed to get socials');

  const socials = rawSocials.data;

  const userActionRow: APIComponentInMessageActionRow[] = [
    {
      type: ComponentType.Button,
      style: ButtonStyle.Link,
      label: 'Github Profile',
      url: data.html_url,
    },
  ];
  if (!v.isEmpty(data.blog ?? undefined)) {
    const url = data.blog!.startsWith('http')
      ? data.blog!
      : `http://${data.blog}`;
    userActionRow.push({
      type: ComponentType.Button,
      style: ButtonStyle.Link,
      label: 'Website',
      url,
    });
  }

  const container = new ContainerBuilder({
    accent_color: env.EMBED_COLOR,
    components: [
      {
        type: ComponentType.TextDisplay,
        content: '# User Information',
      },
      {
        type: ComponentType.Section,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: stripIndents`
            **Username:** \`${data.login}\`
            **ID:** ${data.id}
            **Type:** ${data.type}
            **Name:** \`${data.name ?? 'N/A'}\`
            **Company:** \`${data.company ?? 'N/A'}\`
            **Website:** \`${data.blog || 'N/A'}\`
            **Location:** \`${data.location ?? 'N/A'}\`
            **Bio:** \`${data.bio ?? 'N/A'}\`
            `,
          },
        ],
        accessory: {
          type: ComponentType.Thumbnail,
          media: {
            url: data.avatar_url,
          },
        },
      },
      {
        type: ComponentType.ActionRow,
        components: userActionRow,
      },
    ],
  });

  if (socials.length > 0) {
    container.addActionRowComponents({
      type: ComponentType.ActionRow,
      components: socials.map((social) => ({
        type: ComponentType.Button,
        style: ButtonStyle.Link,
        label: social.provider === 'Generic' ? 'Social' : social.provider,
        url: social.url,
      })),
    });
  }

  container.addSeparatorComponents({ type: ComponentType.Separator });
  container.addTextDisplayComponents({
    type: ComponentType.TextDisplay,
    content: stripIndents`
    ## Stats
    **Public Repos:** ${data.public_repos}
    **Public Gists:** ${data.public_gists}
    **Followers:** ${data.followers}
    **Following:** ${data.following}
    `,
  });
  container.addTextDisplayComponents({
    type: ComponentType.TextDisplay,
    content: '> Powered by GitHub API',
  });

  await intr.followUp({
    flags: MessageFlags.IsComponentsV2,
    components: [container],
  });
}

async function getLicense(key: string): Promise<
  Result<{
    content: string;
    html_url: string;
  }>
> {
  const result = await fetchGitHubData(`/licenses/${key}`, licenseSchema);
  if (result.error) return result;

  const { name, html_url, permissions, conditions, limitations } = result.data;
  return {
    data: {
      content: stripIndents`
      **Name:** ${v.titleCase(name)}
      **Permissions:** ${v.titleCase(permissions.join(', '))}
      **Conditions:** ${v.titleCase(conditions.join(', '))}
      **Limitations:** ${v.titleCase(limitations.join(', '))}
      `,
      html_url,
    },
  };
}

async function getSocials(user: string): Promise<Result<Socials>> {
  const result = await fetchGitHubData(
    `/users/${user}/social_accounts`,
    socialsSchema
  );
  if (result.error) return result;

  return { data: result.data };
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
