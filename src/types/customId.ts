import { z } from 'zod';

export const customId = z
  .string()
  .min(1)
  .max(100)
  // allows one or more lowercase letters or digits
  // allows zero or more groups of a hyphen followed by one or more lowercase letters or digits
  // the pattern still prevents starting or ending with a hyphen and disallows consecutive hyphens
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
