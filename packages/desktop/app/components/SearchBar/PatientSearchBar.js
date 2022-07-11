import React from 'react';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import {
  AutocompleteField,
  CheckField,
  Field,
  LocalisedField,
  DisplayIdField,
  DateField,
} from '../Field';
import { useSuggester } from '../../api';

export const PatientSearchBar = React.memo(({ onSearch }) => {
  const facilitySuggester = useSuggester('facility');
  const locationSuggester = useSuggester('location');
  const departmentSuggester = useSuggester('department');
  const practitionerSuggester = useSuggester('practitioner');
  return (
    <CustomisableSearchBar
      title="Search for Patients"
      renderCheckField={
        <Field name="deceased" label="Include deceased patients" component={CheckField} />
      }
      onSearch={onSearch}
      initialValues={{ displayIdExact: true }}
    >
      <LocalisedField name="firstName" />
      <LocalisedField name="lastName" />
      <Field name="dateOfBirthExact" label="DOB" component={DateField} />
      <DisplayIdField />
      <LocalisedField
        name="facilityId"
        defaultLabel="Facility"
        component={AutocompleteField}
        suggester={facilitySuggester}
      />
      <LocalisedField
        name="locationId"
        defaultLabel="Location"
        component={AutocompleteField}
        suggester={locationSuggester}
      />
      <LocalisedField
        name="departmentId"
        defaultLabel="Department"
        component={AutocompleteField}
        suggester={departmentSuggester}
      />
      <LocalisedField
        name="clinicianId"
        defaultLabel="Clinician"
        component={AutocompleteField}
        suggester={practitionerSuggester}
      />
    </CustomisableSearchBar>
  );
});
