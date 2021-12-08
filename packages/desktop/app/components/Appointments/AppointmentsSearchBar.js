import React from 'react';
import { CustomisablePatientSearchBar } from '../../views/patients/components/PatientSearchBar';
import { SelectField } from '../Field';
import { appointmentTypeOptions } from '../../constants';

export const AppointmentsSearchBar = ({ onSearch }) => {
  return (
    <CustomisablePatientSearchBar
      title="Search appointments"
      onSearch={onSearch}
      fields={[
        ['firstName'],
        ['lastName'],
        ['displayId'],
        [
          'type',
          {
            placeholder: 'Appointment Type',
            component: SelectField,
            options: appointmentTypeOptions,
          },
        ],
      ]}
    />
  );
};
