import React from 'react';

import { AutocompleteField, TextField } from '..';
import { useSuggester } from '../../api';
import { ConfiguredMandatoryPatientFields } from './ConfiguredMandatoryPatientFields';
import { TranslatedText } from '../Translation/TranslatedText';

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
      label: (
        <TranslatedText stringId="general.localisedField.cityTown.label" fallback="City/town" />
      ),
    },
    subdivisionId: {
      component: AutocompleteField,
      suggester: subdivisionSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.subdivisionId.label"
          fallback="Sub division"
        />
      ),
    },
    divisionId: {
      component: AutocompleteField,
      suggester: divisionSuggester,
      label: (
        <TranslatedText stringId="general.localisedField.divisionId.label" fallback="Division" />
      ),
    },
    countryId: {
      component: AutocompleteField,
      suggester: countrySuggester,
      label: (
        <TranslatedText stringId="general.localisedField.countryId.label" fallback="Country" />
      ),
    },
    settlementId: {
      component: AutocompleteField,
      suggester: settlementSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.settlementId.label"
          fallback="Settlement"
        />
      ),
    },
    medicalAreaId: {
      component: AutocompleteField,
      suggester: medicalAreaSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.medicalAreaId.label"
          fallback="Medical area"
        />
      ),
    },
    nursingZoneId: {
      component: AutocompleteField,
      suggester: nursingZoneSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.nursingZoneId.label"
          fallback="Nursing zone"
        />
      ),
    },
    streetVillage: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.streetVillage.label"
          fallback="Residential landmark"
        />
      ),
    },
  };

  return (
    <ConfiguredMandatoryPatientFields
      fields={LOCATION_INFORMATION_FIELDS}
      showMandatory={showMandatory}
    />
  );
};
