import React from 'react';
import { useSuggester } from '../../api';
import { AutocompleteField, LocalisedField } from '../../components';
import { TranslatedText } from '../../components/Translation/TranslatedText';

export const VillageField = ({ name = 'villageName', required }) => {
  const villageSuggester = useSuggester('village');
  // TODO do we use this in reports with specific names mapped to localisation
  return (
    <LocalisedField
      name={name}
      label={
        <TranslatedText stringId="general.localisedField.villageName.label" fallback="Village" />
      }
      path="fields.villageId"
      component={AutocompleteField}
      suggester={villageSuggester}
      required={required}
    />
  );
};
