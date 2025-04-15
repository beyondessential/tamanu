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
          data-testid="translatedtext-mhce"
        />
      ),
    },
    subdivisionId: {
      component: AutocompleteField,
      suggester: subdivisionSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.subdivisionId.label"
          fallback="Sub division"
          data-testid="translatedtext-mlmz"
        />
      ),
    },
    divisionId: {
      component: AutocompleteField,
      suggester: divisionSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.divisionId.label"
          fallback="Division"
          data-testid="translatedtext-s0p5"
        />
      ),
    },
    countryId: {
      component: AutocompleteField,
      suggester: countrySuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.countryId.label"
          fallback="Country"
          data-testid="translatedtext-k8xy"
        />
      ),
    },
    settlementId: {
      component: AutocompleteField,
      suggester: settlementSuggester,
      label: (
        <TranslatedText
          stringId="general.localisedField.settlementId.label"
          fallback="Settlement"
          data-testid="translatedtext-evid"
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
          data-testid="translatedtext-73sd"
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
          data-testid="translatedtext-iour"
        />
      ),
    },
    streetVillage: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.streetVillage.label"
          fallback="Residential landmark"
          data-testid="translatedtext-26lx"
        />
      ),
    },
  };
  return (
    <ConfiguredMandatoryPatientFields
      fields={LOCATION_FIELDS}
      filterByMandatory={filterByMandatory}
      data-testid="configuredmandatorypatientfields-kh6c"
    />
  );
};
