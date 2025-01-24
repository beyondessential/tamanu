import React from 'react';
import { AutocompleteInput } from '../Field';
import { FrequencySuggester } from './frequencySuggester';
import { TranslatedText } from '../Translation/TranslatedText';
import { useTranslation } from '../../contexts/Translation';
import { getTranslatedFrequencySynonyms } from '../../utils/medications';

const getFrequencySuggestions = synonyms => {
  return Object.entries(synonyms).map(([key, value]) => ({
    label: `${key} (${value[0]})`,
    value: key,
    synonyms: value,
  }));
};

export const FrequencySearchInput = ({ ...props }) => {
  const { getTranslation } = useTranslation();
  const translatedFrequencySynonyms = getTranslatedFrequencySynonyms(getTranslation);

  const frequencySuggestions = getFrequencySuggestions(translatedFrequencySynonyms);
  const frequencySuggester = new FrequencySuggester(frequencySuggestions);

  return (
    <AutocompleteInput
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
