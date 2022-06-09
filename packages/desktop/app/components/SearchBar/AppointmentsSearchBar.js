import React from 'react';
import { startOfDay } from 'date-fns';
import { CustomisableSearchBar } from '../CustomisableSearchBar';
import { StyledSelectField, DateTimeField, AutocompleteField } from '../Field';
import { Suggester } from '../../utils/suggester';
import { appointmentTypeOptions, appointmentStatusOptions } from '../../constants';
import { useApi } from '../../api';

export const AppointmentsSearchBar = ({ onSearch }) => {
  const api = useApi();
  return (
    <CustomisableSearchBar
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
        ['after', { component: DateTimeField, placeholder: 'Start from' }],
        ['before', { component: DateTimeField, placeholder: 'Until' }],
        ['displayId'],
      ]}
      initialValues={{
        after: startOfDay(new Date()),
      }}
    />
  );
};
