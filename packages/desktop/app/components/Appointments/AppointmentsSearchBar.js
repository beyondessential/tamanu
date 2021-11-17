import React from 'react';
import { CustomisablePatientSearchBar } from '../../views/patients/components/PatientSearchBar';

export const AppointmentsSearchBar = () => {
  return (
    <CustomisablePatientSearchBar
      title="Search appointments"
      fields={[
        ['firstName'],
        ['lastName'],
        ['displayId'],
      ]}
    />
  );
};
