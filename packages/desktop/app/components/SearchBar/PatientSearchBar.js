import React from 'react';
import { getCurrentDateString } from 'shared/utils/dateTime';
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

export const PatientSearchBar = React.memo(
  ({ onSearch, searchParameters, suggestByFacility = true }) => {
    const locationGroupSuggester = useSuggester('locationGroup', {
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
        initialValues={{ displayIdExact: true, ...searchParameters }}
      >
        <LocalisedField name="firstName" />
        <LocalisedField name="lastName" />
        <Field
          name="dateOfBirthExact"
          label="DOB"
          max={getCurrentDateString()}
          component={DateField}
          saveDateAsString
        />
        <DisplayIdField />
        <LocalisedField
          name="locationGroupId"
          defaultLabel="Location"
          component={AutocompleteField}
          suggester={locationGroupSuggester}
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
  },
);
