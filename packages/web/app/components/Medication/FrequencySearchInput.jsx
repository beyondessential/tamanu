import React from 'react';
import { ADMINISTRATION_FREQUENCY_DETAILS } from '@tamanu/constants';
import { AutocompleteInput } from '../Field';
import { FrequencySuggester } from './frequencySuggester';
import { TranslatedText } from '../Translation/TranslatedText';
import { useTranslation } from '../../contexts/Translation';
import { MultiAutocompleteInput } from '../Field/MultiAutocompleteField';

const getFrequencySuggestions = (details, language) => {
  return Object.entries(details[language]).map(([key, value]) => ({
    label: `${key} (${value.synonyms[0]})`,
    value: key,
    synonyms: value.synonyms,
    startTimes: value.startTimes,
    dosesPerDay: value.dosesPerDay,
  }));
};

export const FrequencySearchInput = ({ ...props }) => {
  const { storedLanguage } = useTranslation();

  const frequencySuggestions = getFrequencySuggestions(
    ADMINISTRATION_FREQUENCY_DETAILS,
    storedLanguage,
  );
  const frequencySuggester = new FrequencySuggester(frequencySuggestions);

  return (
    <MultiAutocompleteInput
      label={<TranslatedText stringId="medication.frequency.label" fallback="Frequency" />}
      suggester={frequencySuggester}
      {...props}
    />
  );
};

export const FrequencySearchField = ({ field, ...props }) => {
  return (
    <FrequencySearchInput
      name={field.name}
      value={field.value || ''}
      onChange={field.onChange}
      {...props}
    />
  );
};
