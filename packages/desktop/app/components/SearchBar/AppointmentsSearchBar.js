import React from 'react';
import { startOfDay } from 'date-fns';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import {
  DateTimeField,
  AutocompleteField,
  LocalisedField,
  SelectField,
  SuggesterSelectField,
} from '../Field';
import { appointmentTypeOptions, appointmentStatusOptions } from '../../constants';
import { useSuggester } from '../../api';
import { useLocalisation } from '../../contexts/Localisation';

export const AppointmentsSearchBar = ({ onSearch }) => {
  const { getLocalisation } = useLocalisation();
  const practitionerSuggester = useSuggester('practitioner');
  const locationSuggester = useSuggester('location', {
    baseQueryParameters: { filterByFacility: true },
  });
  const locationHierarchyEnabled = getLocalisation('features.locationHierarchy');

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
      {locationHierarchyEnabled ? (
        <LocalisedField
          defaultLabel="Area"
          name="locationGroupId"
          endpoint="locationGroup"
          component={SuggesterSelectField}
        />
      ) : (
        <LocalisedField
          name="locationId"
          defaultLabel="Location"
          component={AutocompleteField}
          suggester={locationSuggester}
        />
      )}
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
