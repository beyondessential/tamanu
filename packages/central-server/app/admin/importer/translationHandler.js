import { camelCase, isArray, isObject, isString } from 'lodash';
import {
  TRANSLATABLE_REFERENCE_TYPES,
  REFERENCE_DATA_TRANSLATION_PREFIX,
  DEFAULT_LANGUAGE_CODE,
} from '@tamanu/constants';
import { getReferenceDataOptionStringId } from '@tamanu/shared/utils/translation';

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
      translationData.push({ stringId, text: recordText, language: DEFAULT_LANGUAGE_CODE });
    }

    // Handle records with multiple translatable text fields by adding another layer of nesting
    if (isObject(recordText)) {
      Object.entries(recordText).forEach(([key, text]) => {
        const stringId = `${REFERENCE_DATA_TRANSLATION_PREFIX}.${dataType}.${key}.${values.id}`;
        if (text) {
          translationData.push({ stringId, text, language: DEFAULT_LANGUAGE_CODE });
        }
      });
    }
    const options = extractTranslatableOptions(values, dataType);
    // // Create translations for reference data record options if they exist
    // // This includes patient_field_definition options

    if (options.length > 0) {
      for (const option of options) {
        translationData.push({
          stringId: getReferenceDataOptionStringId(values.id, dataType, option),
          text: option,
          language: DEFAULT_LANGUAGE_CODE,
        });
      }
    }
  }

  return translationData;
}
