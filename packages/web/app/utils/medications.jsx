import { ADMINISTRATION_FREQUENCY_SYNONYMS } from '@tamanu/constants';
import { camelCase } from 'lodash';

export const getTranslatedFrequencySynonyms = (frequenciesEnabled, getTranslation) => {
  const result = {};
  Object.entries(ADMINISTRATION_FREQUENCY_SYNONYMS).forEach(([frequency, synonyms]) => {
    if (!frequenciesEnabled?.[frequency]) return;
    const labelKey = getTranslation(
      `medication.frequency.${camelCase(frequency)}.label`,
      frequency,
    );

    const translatedSynonyms = synonyms.map((synonym, index) =>
      getTranslation(`medication.frequency.${camelCase(frequency)}.synonym.${index}`, synonym),
    );

    result[labelKey] = translatedSynonyms;
  });

  return result;
};

export const getTranslatedFrequencySynonym = (synonyms, index, getTranslation) => {
  const frequency = synonyms[index];
  return getTranslation(`medication.frequency.${camelCase(frequency)}.synonym.${index}`, frequency);
}

export const getTranslatedFrequency = (frequency, getTranslation) => {
  return getTranslation(`medication.frequency.${camelCase(frequency)}.label`, frequency);
};
