import { z } from 'zod';

/** Map of translation string ID to translated text, for a single language. */
export const TranslationsSchema = z.record(z.string(), z.string());

export type Translations = z.infer<typeof TranslationsSchema>;
