import { QueryInterface, QueryTypes } from 'sequelize';
import { REFERENCE_TYPES, REFERENCE_DATA_TRANSLATION_PREFIX } from '@tamanu/constants';

const makeNoteTypeId = (noteType: string): string => `notetype-${noteType}`;

interface Translation {
  string_id: string;
  language: string;
  text: string;
}

export async function up(query: QueryInterface): Promise<void> {
  const existingTranslations = await query.sequelize.query<Translation>(
    `SELECT string_id, language, text FROM translated_strings WHERE string_id ILIKE 'note.property.type%'`,
    { type: QueryTypes.SELECT }
  );

  const translationsToInsert: Translation[] = [];

  if (existingTranslations.length > 0) {
    const migratedTranslations = existingTranslations
      .map((translation) => {
        // Replace to get noteType, e.g. 'note.property.type.treatmentPlan' -> 'treatmentPlan'
        const noteType = translation.string_id.replace(`note.property.type.`, '');

        // Create string_id for the new translation, e.g. 'refData.noteType.notetype-treatmentPlan'
        const newStringId = `${REFERENCE_DATA_TRANSLATION_PREFIX}.${REFERENCE_TYPES.NOTE_TYPE}.${makeNoteTypeId(noteType)}`;

        return {
          string_id: newStringId,
          language: translation.language,
          text: translation.text,
        };
      })
      .filter(Boolean);

    translationsToInsert.push(...migratedTranslations);
  }

  if (translationsToInsert.length > 0) {
    for (const translation of translationsToInsert) {
      await query.sequelize.query(
        `
        INSERT INTO translated_strings (string_id, language, text)
        VALUES (:string_id, :language, :text)
        ON CONFLICT (string_id, language) DO UPDATE SET
          text = EXCLUDED.text
        `,
        {
          replacements: {
            string_id: translation.string_id,
            language: translation.language,
            text: translation.text,
          },
        },
      );
    }
  }
}

export async function down(query: QueryInterface): Promise<void> {
  await query.sequelize.query(
    `DELETE FROM translated_strings WHERE string_id ILIKE '${REFERENCE_DATA_TRANSLATION_PREFIX}.${REFERENCE_TYPES.NOTE_TYPE}%'`
  );
}
