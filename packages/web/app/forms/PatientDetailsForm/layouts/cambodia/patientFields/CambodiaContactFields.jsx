import React from 'react';

import { AutocompleteField, TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';
import { useSuggester } from '../../../../../api';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';

export const CambodiaContactFields = ({ filterByMandatory }) => {
  const medicalAreaSuggester = useSuggester('medicalArea');
  const facilitySuggester = useSuggester('facility');
  const CONTACT_FIELDS = {
    primaryContactNumber: {
      component: TextField,
      type: 'tel',
      label: (
        <TranslatedText
          stringId="general.localisedField.primaryContactNumber.label"
          fallback="Mother's contact number"
        />
      ),
    },
    secondaryContactNumber: {
      component: TextField,
      type: 'tel',
      label: (
        <TranslatedText
          stringId="general.localisedField.secondaryContactNumber.label"
          fallback="Father's contact number"
        />
      ),
    },
    emergencyContactName: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.emergencyContactName.label"
          fallback="Guardian's name"
        />
      ),
    },
    emergencyContactNumber: {
      component: TextField,
      type: 'tel',
      label: (
        <TranslatedText
          stringId="general.localisedField.emergencyContactNumber.label"
          fallback="Guardian's number"
        />
      ),
    },
    medicalAreaId: {
      component: AutocompleteField,
      label: (
        <TranslatedText
          stringId="general.localisedField.medicalAreaId.label"
          fallback="Operational district"
        />
      ),
      suggester: medicalAreaSuggester,
    },
    healthCenterId: {
      component: AutocompleteField,
      label: (
        <TranslatedText
          stringId="general.localisedField.nursingZoneId.label"
          fallback="Health center"
        />
      ),
      suggester: facilitySuggester,
    },
  };
  return (
    <ConfiguredMandatoryPatientFields
      fields={CONTACT_FIELDS}
      filterByMandatory={filterByMandatory}
    />
  );
};
