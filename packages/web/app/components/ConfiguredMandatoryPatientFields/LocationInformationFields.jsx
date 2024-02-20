import React from 'react';

import { AutocompleteField, TextField } from '..';
import { useSuggester } from '../../api';
import { ConfiguredMandatoryPatientFields } from './ConfiguredMandatoryPatientFields';

export const LocationInformationFields = ({ showMandatory }) => {
  const countrySuggester = useSuggester('country');
  const divisionSuggester = useSuggester('division');
  const medicalAreaSuggester = useSuggester('medicalArea');
  const nursingZoneSuggester = useSuggester('nursingZone');
  const settlementSuggester = useSuggester('settlement');
  const subdivisionSuggester = useSuggester('subdivision');

  const LOCATION_INFORMATION_FIELDS = {
    cityTown: {
      component: TextField,
    },
    subdivisionId: {
      component: AutocompleteField,
      suggester: subdivisionSuggester,
    },
    divisionId: {
      component: AutocompleteField,
      suggester: divisionSuggester,
    },
    countryId: {
      component: AutocompleteField,
      suggester: countrySuggester,
    },
    settlementId: {
      component: AutocompleteField,
      suggester: settlementSuggester,
    },
    medicalAreaId: {
      component: AutocompleteField,
      suggester: medicalAreaSuggester,
    },
    nursingZoneId: {
      component: AutocompleteField,
      suggester: nursingZoneSuggester,
    },
    streetVillage: {
      component: TextField,
    },
  };

  return (
    <ConfiguredMandatoryPatientFields
      fields={LOCATION_INFORMATION_FIELDS}
      showMandatory={showMandatory}
    />
  );
};
