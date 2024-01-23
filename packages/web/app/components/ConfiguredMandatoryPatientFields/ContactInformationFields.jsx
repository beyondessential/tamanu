import React from 'react';

import { TextField } from '..';
import { ConfiguredMandatoryPatientFields } from './ConfiguredMandatoryPatientFields';

const CONTACT_INFORMATION_FIELDS_PROPS = {
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
};

export const ContactInformationFields = ({ showMandatory }) => {
  return (
    <ConfiguredMandatoryPatientFields
      fields={CONTACT_INFORMATION_FIELDS_PROPS}
      showMandatory={showMandatory}
    />
  );
};
