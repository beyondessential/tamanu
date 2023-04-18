import React from 'react';
import { startOfDay } from 'date-fns';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { DateTimeField, AutocompleteField, LocalisedField, SelectField } from '../Field';
import { appointmentTypeOptions, appointmentStatusOptions } from '../../constants';
import { useSuggester } from '../../api';

export const AppointmentsSearchBar = ({ onSearch }) => {
  const practitionerSuggester = useSuggester('practitioner');
  const locationGroupSuggester = useSuggester('facilityLocationGroup');

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
      initialValues={{
        after: startOfDay(new Date()),
      }}
      staticValues={{
        displayIdExact: true,
      }}
    >
      <LocalisedField name="firstName" />
      <LocalisedField name="lastName" />
      <LocalisedField
        name="clinicianId"
        defaultLabel="Clinician"
        component={AutocompleteField}
        suggester={practitionerSuggester}
      />
      <LocalisedField
        defaultLabel="Area"
        name="locationGroupId"
        component={AutocompleteField}
        suggester={locationGroupSuggester}
      />
      <LocalisedField
        name="type"
        defaultLabel="Appointment Type"
        component={SelectField}
        options={appointmentTypeOptions}
      />
      <LocalisedField
        name="status"
        defaultLabel="Appointment Status"
        component={SelectField}
        options={appointmentStatusOptions}
      />
      <LocalisedField
        saveDateAsString
        name="after"
        defaultLabel="Start from"
        component={DateTimeField}
      />
      <LocalisedField
        saveDateAsString
        name="before"
        defaultLabel="Until"
        component={DateTimeField}
      />
      <LocalisedField name="displayId" />
    </CustomisableSearchBar>
  );
};
