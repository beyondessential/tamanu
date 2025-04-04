import React from 'react';
import { useSuggester } from '../../api';
import { AutocompleteField, LocalisedField } from '../../components';
import { TranslatedText } from '../../components/Translation/TranslatedText';

export const VillageField = ({ name = 'village', label, required }) => {
  const villageSuggester = useSuggester('village');
  return (
    <LocalisedField
      name={name}
      label={
        label ?? (
          <TranslatedText
            stringId="general.localisedField.villageId.label"
            fallback="Village"
            data-testid='translatedtext-z1gl' />
        )
      }
      path="fields.villageId"
      component={AutocompleteField}
      suggester={villageSuggester}
      required={required}
      data-testid='localisedfield-c49p' />
  );
};
