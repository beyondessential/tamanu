import React from 'react';

import { TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../ConfiguredMandatoryPatientFields';
import { TranslatedText } from '../../../../../components/Translation/TranslatedText';

export const GenericContactFields = ({ filterByMandatory }) => {
  const CONTACT_FIELDS = {
    primaryContactNumber: {
      component: TextField,
      type: 'tel',
      label: (
        <TranslatedText
          stringId="general.localisedField.primaryContactNumber.label"
          fallback="Primary contact number"
        />
      ),
    },
    secondaryContactNumber: {
      component: TextField,
      type: 'tel',
      label: (
        <TranslatedText
          stringId="general.localisedField.secondaryContactNumber.label"
          fallback="Secondary contact number"
        />
      ),
    },
    emergencyContactName: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.emergencyContactName.label"
          fallback="Emergency contact name"
        />
      ),
    },
    emergencyContactNumber: {
      component: TextField,
      type: 'tel',
      label: (
        <TranslatedText
          stringId="general.localisedField.emergencyContactNumber.label"
          fallback="Emergency contact number"
        />
      ),
    },
  };
  return (
    <ConfiguredMandatoryPatientFields
      fields={CONTACT_FIELDS}
      filterByMandatory={filterByMandatory}
    />
  );
};
