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
          data-test-id='translatedtext-xboz' />
      ),
    },
    secondaryContactNumber: {
      component: TextField,
      type: 'tel',
      label: (
        <TranslatedText
          stringId="general.localisedField.secondaryContactNumber.label"
          fallback="Secondary contact number"
          data-test-id='translatedtext-d5qy' />
      ),
    },
    emergencyContactName: {
      component: TextField,
      label: (
        <TranslatedText
          stringId="general.localisedField.emergencyContactName.label"
          fallback="Emergency contact name"
          data-test-id='translatedtext-p8yw' />
      ),
    },
    emergencyContactNumber: {
      component: TextField,
      type: 'tel',
      label: (
        <TranslatedText
          stringId="general.localisedField.emergencyContactNumber.label"
          fallback="Emergency contact number"
          data-test-id='translatedtext-fzwx' />
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
