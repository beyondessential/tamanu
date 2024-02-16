import React from 'react';

import { TextField } from '../../../../../components';
import { ConfiguredMandatoryPatientFields } from '../../../../../components/ConfiguredMandatoryPatientFields';

export const GenericContactFields = ({
  filterByMandatory,
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
  };
  return <ConfiguredMandatoryPatientFields fields={CONTACT_FIELDS} filterByMandatory={filterByMandatory} />;
};
