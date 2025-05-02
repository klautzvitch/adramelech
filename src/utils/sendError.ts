import { stripIndents } from 'common-tags';
import {
  Colors,
  CommandInteraction,
  ComponentType,
  MessageComponentInteraction,
  MessageFlags,
  type BaseInteraction,
  type InteractionReplyOptions,
} from 'discord.js';

export async function sendError(
  interaction: BaseInteraction,
  description: string = 'An error occurred while executing the command.',
  toDm = false
) {
  const response: InteractionReplyOptions = {
    components: [
      {
        type: ComponentType.Container,
        accentColor: Colors.Red,
        components: [
          {
            type: ComponentType.TextDisplay,
            content: stripIndents`
            # Error
            \`\`\`
            ${description}
            \`\`\`
            `,
          },
        ],
      },
    ],
    flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2],
  };

  if (toDm) {
    try {
      await interaction.user.send({ embeds: response.embeds });
    } catch {
      // ignore
    }
  }

  const intr = interaction as MessageComponentInteraction | CommandInteraction;

  if (interaction.isRepliable()) {
    try {
      if (intr.deferred || intr.replied) {
        // Delete the original response, because we need it to be ephemeral
        // This has the drawback of losing the mention of the invoked command
        const msg = await intr.followUp('opps...');
        await msg.delete();
        await intr.followUp(response);
      } else {
        await intr.reply(response);
      }
    } catch {
      // ignore
    }
  }
}
