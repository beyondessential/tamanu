import React from 'react';

import { AutocompleteField, TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../../../components/ConfiguredMandatoryPatientFields';

export const CambodiaContactFields = ({
  filterByMandatory,
  nursingZoneSuggester,
  medicalAreaSuggester,
}) => {
  const CONTACT_FIELDS = {
    primaryContactNumber: {
      component: TextField,
      type: 'tel',
    },
    secondaryContactNumber: {
      component: TextField,
      type: 'tel',
    },
    emergencyContactName: {
      component: TextField,
    },
    emergencyContactNumber: {
      component: TextField,
      type: 'tel',
    },
    medicalAreaId: {
      component: AutocompleteField,
      suggester: medicalAreaSuggester,
    },
    nursingZoneId: {
      component: AutocompleteField,
      suggester: nursingZoneSuggester,
    },
  };
  return <ConfiguredMandatoryPatientFields fields={CONTACT_FIELDS} filterByMandatory={filterByMandatory} />;
};
