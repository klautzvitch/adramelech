import type { Precondition } from '~/types/precondition';
import { sendError } from '~/utils/sendError';

const execute: Precondition = async (intr) => {
  const application = await intr.client.application.fetch();
  const owner = await intr.client.users.fetch(application.owner!.id);
  if (intr.user.id !== owner.id) {
    await sendError(
      intr,
      'You must be the owner of the bot to use this command.'
    );
    return false;
  }

  return true;
};

export default execute;
