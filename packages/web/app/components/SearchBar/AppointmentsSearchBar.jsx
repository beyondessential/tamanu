import React from 'react';
import { startOfDay } from 'date-fns';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import {
  AutocompleteField,
  DateTimeField,
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
      <LocalisedField
        name="type"
        label={
          <TranslatedText
            stringId="general.localisedField.type.label"
            fallback="Appointment Type"
          />
        }
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
      <LocalisedField
        saveDateAsString
        name="after"
        label={
          <TranslatedText stringId="general.localisedField.after.label" fallback="Start from" />
        }
        component={DateTimeField}
      />
      <LocalisedField
        saveDateAsString
        name="before"
        label={<TranslatedText stringId="general.localisedField.before.label" fallback="Until" />}
        component={DateTimeField}
      />
      <LocalisedField
        keepLetterCase
        label={
          <TranslatedText stringId="general.localisedField.displayId.label.short" fallback="NHN" />
        }
        name="displayId"
        component={SearchField}
      />
    </CustomisableSearchBar>
  );
};
