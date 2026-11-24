import * as z from 'zod';

const emailSchema = z.email();

/** A single bare address: no display name, no list, nothing a mail header could be split on. */
export const isEmailAddress = (value: unknown): value is string =>
  emailSchema.safeParse(value).success;
