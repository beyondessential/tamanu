import { QueryInterface, QueryTypes } from 'sequelize';
import { prefixMap, NOTE_TYPE_LABELS, REFERENCE_TYPES, REFERENCE_DATA_TRANSLATION_PREFIX } from '@tamanu/constants';

interface Translation {
  string_id: string;
  language: string;
  text: string;
}

export async function up(query: QueryInterface): Promise<void> {
  const notTypePrefix = prefixMap.get(NOTE_TYPE_LABELS);

  if (!notTypePrefix) {
    throw new Error('NOTE_TYPE_LABELS prefix not found');
  }

  const existingTranslations = await query.sequelize.query<Translation>(
    `SELECT string_id, language, text FROM translated_strings WHERE string_id ILIKE '${notTypePrefix}%'`,
    { type: QueryTypes.SELECT }
  );

  if (existingTranslations.length === 0) {
    return;
  }

  const translationsToInsert = existingTranslations
    .map((translation) => {

      return {
        string_id: translation.string_id.replace(notTypePrefix, `${REFERENCE_DATA_TRANSLATION_PREFIX}.${REFERENCE_TYPES.NOTE_TYPE}`),
        language: translation.language,
        text: translation.text,
      };
    })
    .filter(Boolean);

  if (translationsToInsert.length > 0) {
    await query.bulkInsert('translated_strings', translationsToInsert);
  }
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(
    `DELETE FROM translated_strings WHERE string_id ILIKE '${REFERENCE_DATA_TRANSLATION_PREFIX}.${REFERENCE_TYPES.NOTE_TYPE}%'`
  );
}
