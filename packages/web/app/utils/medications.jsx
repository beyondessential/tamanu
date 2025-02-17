import { ADMINISTRATION_FREQUENCY_SYNONYMS } from '@tamanu/constants';
import { camelCase } from 'lodash';

export const getTranslatedFrequencySynonyms = getTranslation => {
  const result = {};
  Object.entries(ADMINISTRATION_FREQUENCY_SYNONYMS).forEach(([frequency, synonyms]) => {
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
