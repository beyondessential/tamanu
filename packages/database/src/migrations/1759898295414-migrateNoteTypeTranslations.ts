import { QueryInterface, QueryTypes } from 'sequelize';
import { prefixMap, NOTE_TYPES, NOTE_TYPE_LABELS, REFERENCE_TYPES, REFERENCE_DATA_TRANSLATION_PREFIX, ENGLISH_LANGUAGE_CODE } from '@tamanu/constants';

const makeNoteTypeId = (code: string): string => `notetype-${code}`;

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

  const translationsToInsert: Translation[] = [];

  if (existingTranslations.length > 0) {
    const migratedTranslations = existingTranslations
      .map((translation) => {
        const oldCode = translation.string_id.replace(`${notTypePrefix}.`, '');
        const newStringId = `${REFERENCE_DATA_TRANSLATION_PREFIX}.${REFERENCE_TYPES.NOTE_TYPE}.${makeNoteTypeId(oldCode)}`;
        
        return {
          string_id: newStringId,
          language: translation.language,
          text: translation.text,
        };
      })
      .filter(Boolean);
    
    translationsToInsert.push(...migratedTranslations);
  }

  const defaultTranslations = Object.values(NOTE_TYPES)
    .map(code => ({
      string_id: `${REFERENCE_DATA_TRANSLATION_PREFIX}.${REFERENCE_TYPES.NOTE_TYPE}.${makeNoteTypeId(code)}`,
      language: ENGLISH_LANGUAGE_CODE,
      text: NOTE_TYPE_LABELS[code] || code,
    }))
    .filter(translation => !translationsToInsert.find(t => t.string_id === translation.string_id && t.language === translation.language));

  translationsToInsert.push(...defaultTranslations);

  if (translationsToInsert.length > 0) {
    await query.bulkInsert('translated_strings', translationsToInsert);
  }
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(
    `DELETE FROM translated_strings WHERE string_id ILIKE '${REFERENCE_DATA_TRANSLATION_PREFIX}.${REFERENCE_TYPES.NOTE_TYPE}%'`
  );
}
