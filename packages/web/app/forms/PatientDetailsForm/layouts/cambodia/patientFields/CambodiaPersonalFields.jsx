import React from 'react';

import {
  AutocompleteField,
} from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../../../components/ConfiguredMandatoryPatientFields';

export const CambodiaPersonalFields = ({
  countrySuggester,
  nationalitySuggester,
  showMandatory,
}) => {
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
    <ConfiguredMandatoryPatientFields fields={PERSONAL_FIELDS} showMandatory={showMandatory} />
  );
};
