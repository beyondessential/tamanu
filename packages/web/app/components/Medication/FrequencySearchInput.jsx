import React from 'react';
import {
  ADMINISTRATION_FREQUENCY_DETAILS,
  ADMINISTRATION_FREQUENCY_SYNONYMS,
} from '@tamanu/constants';
import { AutocompleteInput } from '../Field';
import { FrequencySuggester } from './frequencySuggester';
import { TranslatedText } from '../Translation/TranslatedText';
import { useTranslation } from '../../contexts/Translation';

const getFrequencySuggestions = (synonyms, details, language) => {
  return Object.entries(synonyms[language]).map(([key, value]) => ({
    label: `${key} (${value[0]})`,
    value: key,
    synonyms: value,
    startTimes: details[key].startTimes,
    dosesPerDay: details[key].dosesPerDay,
  }));
};

export const FrequencySearchInput = ({ onChange }) => {
  const { storedLanguage } = useTranslation();

  const frequencySuggestions = getFrequencySuggestions(
    ADMINISTRATION_FREQUENCY_SYNONYMS,
    ADMINISTRATION_FREQUENCY_DETAILS,
    storedLanguage,
  );
  const frequencySuggester = new FrequencySuggester(frequencySuggestions);

  return (
    <AutocompleteInput
      onChange={onChange}
      label={<TranslatedText stringId="medication.frequency.label" fallback="Frequency" />}
      suggester={frequencySuggester}
    />
  );
};
