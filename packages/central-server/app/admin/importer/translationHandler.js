import { camelCase, isArray, isObject, isString } from 'lodash';
import {
  TRANSLATABLE_REFERENCE_TYPES,
  REFERENCE_DATA_TRANSLATION_PREFIX,
  DEFAULT_LANGUAGE_CODE,
} from '@tamanu/constants';
import { normaliseSheetName } from './importerEndpoint';

function extractTranslatableRecordText(values, dataType) {
  if (dataType === 'scheduledVaccine') return values.label;
  if (dataType === 'surveyScreenComponent') return { text: values.text, detail: values.detail };
  return values.name;
}

function extractTranslatableOptions(values, dataType) {
  if (dataType === 'programDataElement') {
    return normaliseOptions(values.defaultOptions);
  }
  return normaliseOptions(values.options);
}

export function normaliseOptions(options) {
  if (!options) return [];

  let parsedOptions;
  try {
    parsedOptions = JSON.parse(options);
  } catch (e) {
    parsedOptions = options;
  }

  if (isArray(parsedOptions)) return parsedOptions;
  if (isObject(parsedOptions)) return Object.values(parsedOptions);
  if (isString(parsedOptions)) return parsedOptions.split(/\s*,\s*/).filter(x => x);

  throw new Error('Invalid options format for translations');
}

export function generateTranslationsForData(model, sheetName, values) {
  const translationData = [];

  const dataType = normaliseSheetName(sheetName, model);
  const isValidTable = model === 'ReferenceData' || camelCase(model) === dataType;
  const isTranslatable = TRANSLATABLE_REFERENCE_TYPES.includes(dataType);

  if (isTranslatable && isValidTable) {
    const recordText = extractTranslatableRecordText(values, dataType);
    if (recordText && isString(recordText)) {
      const stringId = `${REFERENCE_DATA_TRANSLATION_PREFIX}.${dataType}.${values.id}`;
      translationData.push([stringId, recordText, DEFAULT_LANGUAGE_CODE]);
    }

    // Handle records with multiple translatable text fields by adding another layer of nesting
    if (isObject(recordText)) {
      Object.entries(recordText).forEach(([key, text]) => {
        const stringId = `${REFERENCE_DATA_TRANSLATION_PREFIX}.${dataType}.${key}.${values.id}`;
        if (text) {
          translationData.push([stringId, text, DEFAULT_LANGUAGE_CODE]);
        }
      });
    }
    const options = extractTranslatableOptions(values, dataType);
    // // Create translations for reference data record options if they exist
    // // This includes patient_field_definition options
    if (options.length > 0) {
      for (const option of options) {
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

  const duplicates = translationData.filter(
    (item, index, self) => self.findIndex(t => t[0] === item[0]) !== index,
  );
  if (duplicates.length > 0) {
    throw new Error(
      'Duplicates stringId found for stringIds: ' + duplicates.map(d => d[0]).join(', '),
    );
  }

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
  console.log('after translation upsert', translationData);
}
