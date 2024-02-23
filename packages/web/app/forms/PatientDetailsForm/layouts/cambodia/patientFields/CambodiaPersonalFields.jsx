import React from 'react';

import { AutocompleteField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';
import { useSuggester } from '../../../../../api';

export const CambodiaPersonalFields = ({ filterByMandatory }) => {
  const countrySuggester = useSuggester('country');
  const nationalitySuggester = useSuggester('nationality');
  const PERSONAL_FIELDS = {
    countryOfBirthId: {
      component: AutocompleteField,
      suggester: countrySuggester,
    },
    nationalityId: {
      component: AutocompleteField,
      suggester: nationalitySuggester,
    },
  };

  return (
    <ConfiguredMandatoryPatientFields
      fields={PERSONAL_FIELDS}
      filterByMandatory={filterByMandatory}
    />
  );
};
