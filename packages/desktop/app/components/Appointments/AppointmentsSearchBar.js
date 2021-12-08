import React from 'react';
import { CustomisablePatientSearchBar } from '../../views/patients/components/PatientSearchBar';
import { StyledSelectField, DateTimeField } from '../Field';
import { appointmentTypeOptions } from '../../constants';

export const AppointmentsSearchBar = ({ onSearch }) => (
  <CustomisablePatientSearchBar
    title="Search appointments"
    onSearch={values => {
      const { firstName, lastName, displayId, type } = values;
      // map search query to associated column names
      onSearch({
        'patient.first_name': firstName,
        'patient.last_name': lastName,
        'patient.display_id': displayId,
        type,
      });
    }}
    fields={[
      ['firstName'],
      ['lastName'],
      ['displayId'],
      ['clinician', { placeholder: 'Clinician' }],
      ['location', { placeholder: 'Location' }],
      [
        'type',
        {
          placeholder: 'Appointment Type',
          component: StyledSelectField,
          options: appointmentTypeOptions,
        },
      ],
      [
        'startTime',
        { component: DateTimeField, placeholder: 'Start from' },
      ]
    ]}
  />
);
