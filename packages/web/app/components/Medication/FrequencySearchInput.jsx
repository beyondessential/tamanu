import React from 'react';
import { AutocompleteInput } from '../Field';
import { FrequencySuggester } from './frequencySuggester';
import { TranslatedText } from '../Translation/TranslatedText';
import { useTranslation } from '../../contexts/Translation';
import { getTranslatedFrequencySynonyms } from '../../utils/medications';
import { useSettings } from '../../contexts/Settings';
import { Colors } from '../../constants';

const getFrequencySuggestions = synonyms => {
  return Object.entries(synonyms).map(([key, value]) => ({
    label: `${key} <span style="color:${Colors.midText}">(${value[0]})</span>`,
    value: key,
    synonyms: value,
  }));
};

export const FrequencySearchInput = ({ ...props }) => {
  const { getTranslation } = useTranslation();
  const { getSetting } = useSettings();
  const frequenciesEnabled = getSetting(`medications.frequenciesEnabled`);

  const translatedFrequencySynonyms = getTranslatedFrequencySynonyms(
    frequenciesEnabled,
    getTranslation,
  );

  const frequencySuggestions = getFrequencySuggestions(translatedFrequencySynonyms);
  const frequencySuggester = new FrequencySuggester(frequencySuggestions);

  return (
    <AutocompleteInput
      {...props}
      label={<TranslatedText stringId="medication.frequency.label" fallback="Frequency" />}
      suggester={frequencySuggester}
      isHtmlOptionLabel
    />
  );
};

export const FrequencySearchField = ({ field, ...props }) => {
  return <FrequencySearchInput name={field.name} onChange={field.onChange} {...props} />;
};
