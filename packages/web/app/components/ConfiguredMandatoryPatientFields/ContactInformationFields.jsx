import React from 'react';

import { TextField } from '..';
import { ConfiguredMandatoryPatientFields } from './ConfiguredMandatoryPatientFields';
import { TranslatedText } from '../Translation/TranslatedText';

const CONTACT_INFORMATION_FIELDS_PROPS = {
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

export const ContactInformationFields = ({ showMandatory }) => {
  return (
    <ConfiguredMandatoryPatientFields
      fields={CONTACT_INFORMATION_FIELDS_PROPS}
      showMandatory={showMandatory}
    />
  );
};
