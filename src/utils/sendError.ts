import {
  Colors,
  CommandInteraction,
  MessageComponentInteraction,
  MessageFlags,
  type BaseInteraction,
  type InteractionReplyOptions,
} from 'discord.js';

export async function sendError(
  interaction: BaseInteraction,
  description: string = 'An error occurred while executing the command.',
  options: {
    deferred?: boolean;
    toDm?: boolean;
  } = {}
) {
  const { deferred = false, toDm = false } = options;

  const response: InteractionReplyOptions = {
    embeds: [
      {
        color: Colors.Red,
        title: 'Error',
        description,
      },
    ],
    flags: MessageFlags.Ephemeral,
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
      if (deferred) {
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
