import React from 'react';
import { format } from 'date-fns';
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

export const PatientSearchBar = React.memo(({ onSearch, suggestByFacility = true }) => {
  const locationSuggester = useSuggester('location', {
    baseQueryParameters: suggestByFacility ? { filterByFacility: true } : {},
  });
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: suggestByFacility ? { filterByFacility: true } : {},
  });
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
      <input name="facilityId" type="hidden" value=":local" />
      <LocalisedField name="firstName" />
      <LocalisedField name="lastName" />
      <Field
        name="dateOfBirthExact"
        label="DOB"
        max={format(new Date(), 'yyyy-MM-dd')}
        component={DateField}
      />
      <DisplayIdField />
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
