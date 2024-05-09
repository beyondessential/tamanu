import React from 'react';
import { startOfDay } from 'date-fns';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import {
  AutocompleteField,
  DateTimeField,
  Field,
  LocalisedField,
  SearchField,
  SelectField,
} from '../Field';
import { TranslatedText } from '../Translation/TranslatedText';
import { APPOINTMENT_STATUS_OPTIONS, APPOINTMENT_TYPE_OPTIONS } from '../../constants';
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
    >
      <LocalisedField
        name="firstName"
        label={
          <TranslatedText stringId="general.localisedField.firstName.label" fallback="First name" />
        }
        component={SearchField}
      />
      <LocalisedField
        name="lastName"
        label={
          <TranslatedText stringId="general.localisedField.lastName.label" fallback="Last name" />
        }
        component={SearchField}
      />
      <LocalisedField
        name="clinicianId"
        label={
          <TranslatedText stringId="general.localisedField.clinician.label" fallback="Clinician" />
        }
        component={AutocompleteField}
        suggester={practitionerSuggester}
      />
      <LocalisedField
        name="locationGroupId"
        label={
          <TranslatedText stringId="general.localisedField.locationGroupId.label" fallback="Area" />
        }
        component={AutocompleteField}
        suggester={locationGroupSuggester}
      />
      <Field
        name="type"
        label={<TranslatedText stringId="appointment.type.label" fallback="Appointment type" />}
        component={SelectField}
        options={APPOINTMENT_TYPE_OPTIONS}
        size="small"
        prefix="appointment.property.type"
      />
      <LocalisedField
        name="status"
        label={
          <TranslatedText
            stringId="general.localisedField.status.label"
            fallback="Appointment Status"
          />
        }
        component={SelectField}
        options={APPOINTMENT_STATUS_OPTIONS}
        size="small"
        prefix="appointment.property.status"
      />
      <Field
        saveDateAsString
        name="after"
        label={<TranslatedText stringId="search.startFrom.label" fallback="Start from" />}
        component={DateTimeField}
      />
      <Field
        saveDateAsString
        name="before"
        label={<TranslatedText stringId="search.until.label" fallback="Until" />}
        component={DateTimeField}
      />
      <Field
        label={
          <TranslatedText stringId="general.localisedField.displayId.label.short" fallback="NHN" />
        }
        name="displayId"
        component={SearchField}
      />
    </CustomisableSearchBar>
  );
};
