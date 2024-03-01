import React from 'react';

import { AutocompleteField, TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';
import { useSuggester } from '../../../../../api';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';

export const CambodiaContactFields = ({ filterByMandatory }) => {
  const medicalAreaSuggester = useSuggester('medicalArea');
  const nursingZoneSuggester = useSuggester('nursingZone');
  const CONTACT_FIELDS = {
    primaryContactNumber: {
      component: TextField,
      type: 'tel',
      label: (
        <TranslatedText
          stringId="cambodiaPatientDetails.mothersContactNumber.label"
          fallback="Mother's contact number"
        />
      ),
    },
    secondaryContactNumber: {
      component: TextField,
      type: 'tel',
      label: (
        <TranslatedText
          stringId="cambodiaPatientDetails.fathersContactNumber.label"
          fallback="Father's contact number"
        />
      ),
    },
    emergencyContactName: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="cambodiaPatientDetails.guardiansName.label"
          fallback="Guardian's name"
        />
      ),
    },
    emergencyContactNumber: {
      component: TextField,
      type: 'tel',
      label: (
        <TranslatedText
          stringId="cambodiaPatientDetails.guardiansNumber.label"
          fallback="Guardian's number"
        />
      ),
    },
    medicalAreaId: {
      component: AutocompleteField,
      label: (
        <TranslatedText
          stringId="cambodiaPatientDetails.operationalDistrict.label"
          fallback="Operational district"
        />
      ),
      suggester: medicalAreaSuggester,
    },
    nursingZoneId: {
      component: AutocompleteField,
      label: (
        <TranslatedText
          stringId="cambodiaPatientDetails.healthCenter.label"
          fallback="Health center"
        />
      ),
      suggester: nursingZoneSuggester,
    },
  };
  return (
    <ConfiguredMandatoryPatientFields
      fields={CONTACT_FIELDS}
      filterByMandatory={filterByMandatory}
    />
  );
};
