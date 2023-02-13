import React from 'react';
import { useSuggester } from '../../api';
import { AutocompleteField, LocalisedField } from '../../components';

export const VillageField = ({ name = 'village', required }) => {
  const villageSuggester = useSuggester('village');
  return (
    <LocalisedField
      name={name}
      path="fields.villageId"
      component={AutocompleteField}
      suggester={villageSuggester}
      required={required}
    />
  );
};
