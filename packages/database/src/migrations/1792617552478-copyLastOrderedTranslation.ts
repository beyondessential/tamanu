import { QueryInterface } from 'sequelize';
import { DEFAULT_LANGUAGE_CODE } from '@tamanu/constants';

export async function up(query: QueryInterface): Promise<void> {
  // The default-language row holds a captured fallback, which predates 2.48 as "Last ordered"
  await query.sequelize.query(
    `
      INSERT INTO translated_strings (string_id, language, text)
      SELECT 'medication.table.column.lastSent', language, text
      FROM translated_strings
      WHERE string_id = 'medication.table.column.lastOrdered'
        AND language != :defaultLanguage
        AND deleted_at IS NULL
      ON CONFLICT (string_id, language) DO NOTHING
    `,
    { replacements: { defaultLanguage: DEFAULT_LANGUAGE_CODE } },
  );
}

export async function down(): Promise<void> {
  // DESTRUCTIVE: the copied translations are kept
}
