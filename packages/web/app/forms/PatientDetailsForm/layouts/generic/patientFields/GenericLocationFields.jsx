import React from 'react';
import { AutocompleteField, TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';
import { useSuggester } from '../../../../../api';

export const GenericLocationFields = ({ filterByMandatory }) => {
  const subdivisionSuggester = useSuggester('subdivision');
  const divisionSuggester = useSuggester('division');
  const settlementSuggester = useSuggester('settlement');
  const countrySuggester = useSuggester('country');
  const medicalAreaSuggester = useSuggester('medicalArea');
  const nursingZoneSuggester = useSuggester('nursingZone');

  const LOCATION_FIELDS = {
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
      fields={LOCATION_FIELDS}
      filterByMandatory={filterByMandatory}
    />
  );
};
