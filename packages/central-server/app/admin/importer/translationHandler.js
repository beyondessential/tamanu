import { camelCase } from 'lodash';
import {
  TRANSLATABLE_REFERENCE_TYPES,
  REFERENCE_DATA_TRANSLATION_PREFIX,
  DEFAULT_LANGUAGE_CODE,
} from '@tamanu/constants';
import { normaliseSheetName } from './importerEndpoint';

function extractRecordName(values, dataType) {
  if (dataType === 'scheduledVaccine') return values.label;
  return values.name;
}

export function collectTranslationData(model, sheetName, values) {
  const translationData = [];

  const dataType = normaliseSheetName(sheetName, model);
  const isValidTable = model === 'ReferenceData' || camelCase(model) === dataType;
  const isTranslatable = TRANSLATABLE_REFERENCE_TYPES.includes(dataType);

  if (isTranslatable && isValidTable) {
    translationData.push([
      `${REFERENCE_DATA_TRANSLATION_PREFIX}.${dataType}.${values.id}`,
      extractRecordName(values, dataType) ?? '',
      DEFAULT_LANGUAGE_CODE,
    ]);

    // Create translations for reference data record options if they exist
    // This includes patient_field_definition options
    if (values.options && values.options.length > 0) {
      // Handle both an array and comma-separated string of options
      const optionArray = Array.isArray(values.options)
        ? values.options
        : values.options.split(/\s*,\s*/).filter((x) => x);
      for (const option of optionArray) {
        translationData.push([
          `${REFERENCE_DATA_TRANSLATION_PREFIX}.${dataType}.${values.id}.option.${camelCase(option)}`,
          option,
          DEFAULT_LANGUAGE_CODE,
        ]);
      }
    }
  }

  return translationData;
}

export async function bulkUpsertTranslationDefaults(models, translationData) {
  if (translationData.length === 0) return;

  await models.TranslatedString.sequelize.query(
    `
      INSERT INTO translated_strings (string_id, text, language)
      VALUES ${translationData.map(() => '(?)').join(',')}
        ON CONFLICT (string_id, language) DO UPDATE SET text = excluded.text;
    `,
    {
      replacements: translationData,
      type: models.TranslatedString.sequelize.QueryTypes.INSERT,
    },
  );
}
