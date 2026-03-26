import React from 'react';
import { ADMINISTRATION_FREQUENCY_SYNONYMS } from '@tamanu/constants';
import { camelCase } from 'lodash';
import { AutocompleteInput } from '../Field';
import { FrequencySuggester } from './frequencySuggester';
import { TranslatedText } from '../Translation/TranslatedText';
import { useTranslation } from '../../contexts/Translation';
import { useSettings } from '../../contexts/Settings';

export const FrequencySearchInput = ({ ...props }) => {
  const { getTranslation } = useTranslation();
  const { getSetting } = useSettings();
  const frequenciesEnabled = getSetting(`medications.frequenciesEnabled`);

  const frequencySuggestions = Object.entries(ADMINISTRATION_FREQUENCY_SYNONYMS)
    .filter(([frequency]) => frequenciesEnabled?.[frequency])
    .map(([frequency, synonyms]) => {
      const translatedLabel = getTranslation(
        `medication.frequency.${camelCase(frequency)}.label`,
        frequency,
      );

      const translatedSynonyms = synonyms.map((synonym, index) =>
        getTranslation(`medication.frequency.${camelCase(frequency)}.synonym.${index}`, synonym),
      );

      return {
        value: frequency,
        label: `${translatedLabel} (${translatedSynonyms[0]})`,
        synonyms: translatedSynonyms,
      };
    });
  const frequencySuggester = new FrequencySuggester(frequencySuggestions);

  return (
    <AutocompleteInput
      {...props}
      label={<TranslatedText stringId="medication.frequency.label" fallback="Frequency" />}
      suggester={frequencySuggester}
    />
  );
};

export const FrequencySearchField = ({ field, ...props }) => {
  return (
    <FrequencySearchInput
      name={field.name}
      onChange={field.onChange}
      value={field.value || ''}
      {...props}
    />
  );
};
