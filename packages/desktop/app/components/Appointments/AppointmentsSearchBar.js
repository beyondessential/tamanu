import React from 'react';
import { CustomisablePatientSearchBar } from '../../views/patients/components/PatientSearchBar';
import { StyledSelectField, DateTimeField, AutocompleteField } from '../Field';
import { Suggester } from '../../utils/suggester';
import { appointmentTypeOptions, appointmentStatusOptions } from '../../constants';
import { useApi } from '../../api';

export const AppointmentsSearchBar = ({ onSearch }) => {
  const api = useApi();
  return (
    <CustomisablePatientSearchBar
      title="Search appointments"
      onSearch={values => {
        const { firstName, lastName, displayId, ...queries } = values;
        // map search query to associated column names
        onSearch({
          'patient.first_name': firstName,
          'patient.last_name': lastName,
          'patient.display_id': displayId,
          ...queries,
        });
      }}
      fields={[
        ['firstName'],
        ['lastName'],
        ['displayId'],
        [
          'clinicianId',
          {
            placeholder: 'Clinician',
            suggester: new Suggester(api, 'practitioner'),
            component: AutocompleteField,
          },
        ],
        [
          'locationId',
          {
            placeholder: 'Location',
            suggester: new Suggester(api, 'location'),
            component: AutocompleteField,
          },
        ],
        [
          'type',
          {
            placeholder: 'Appointment Type',
            component: StyledSelectField,
            options: appointmentTypeOptions,
          },
        ],
        [
          'status',
          {
            placeholder: 'Appointment Status',
            component: StyledSelectField,
            options: appointmentStatusOptions,
          },
        ],
        ['startTime', { component: DateTimeField, placeholder: 'Start from' }],
      ]}
    />
  );
};
