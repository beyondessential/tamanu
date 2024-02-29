import React from 'react';

import { AutocompleteField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';
import { useSuggester } from '../../../../../api';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';

export const CambodiaPersonalFields = ({ filterByMandatory }) => {
  const countrySuggester = useSuggester('country');
  const nationalitySuggester = useSuggester('nationality');
  const PERSONAL_FIELDS = {
    countryOfBirthId: {
      component: AutocompleteField,
      suggester: countrySuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.countryOfBirthId.label"
          fallback="Country of birth"
        />
      ),
    },
    nationalityId: {
      component: AutocompleteField,
      suggester: nationalitySuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.nationalityId.label"
          fallback="Nationality"
        />
      ),
    },
  };

  return (
    <ConfiguredMandatoryPatientFields
      fields={PERSONAL_FIELDS}
      filterByMandatory={filterByMandatory}
    />
  );
};
