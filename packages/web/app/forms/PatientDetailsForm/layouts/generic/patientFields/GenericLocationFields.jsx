import React from 'react';
import { AutocompleteField, TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';

import { useSuggester } from '../../../../../api';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';

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
      label: (
        <TranslatedText
          stringId="general.localisedField.cityTown.label"
          fallback="City/town"
          data-testid='translatedtext-zyi6' />
      ),
    },
    subdivisionId: {
      component: AutocompleteField,
      suggester: subdivisionSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.subdivisionId.label"
          fallback="Sub division"
          data-testid='translatedtext-gm9e' />
      ),
    },
    divisionId: {
      component: AutocompleteField,
      suggester: divisionSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.divisionId.label"
          fallback="Division"
          data-testid='translatedtext-vhhv' />
      ),
    },
    countryId: {
      component: AutocompleteField,
      suggester: countrySuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.countryId.label"
          fallback="Country"
          data-testid='translatedtext-nk1e' />
      ),
    },
    settlementId: {
      component: AutocompleteField,
      suggester: settlementSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.settlementId.label"
          fallback="Settlement"
          data-testid='translatedtext-4vje' />
      ),
    },
    medicalAreaId: {
      component: AutocompleteField,
      suggester: medicalAreaSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.medicalAreaId.label"
          fallback="Medical area"
          data-testid='translatedtext-bcgj' />
      ),
    },
    nursingZoneId: {
      component: AutocompleteField,
      suggester: nursingZoneSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.nursingZoneId.label"
          fallback="Nursing zone"
          data-testid='translatedtext-8wfv' />
      ),
    },
    streetVillage: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.streetVillage.label"
          fallback="Residential landmark"
          data-testid='translatedtext-vyok' />
      ),
    },
  };
  return (
    <ConfiguredMandatoryPatientFields
      fields={LOCATION_FIELDS}
      filterByMandatory={filterByMandatory}
    />
  );
};
