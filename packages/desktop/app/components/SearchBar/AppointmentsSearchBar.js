import React from 'react';
import { startOfDay } from 'date-fns';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import {
  DateTimeField,
  AutocompleteField,
  LocalisedField,
  SelectField,
  SearchField,
} from '../Field';
import { TranslatedText } from '../Translation/TranslatedText';
import { appointmentTypeOptions, appointmentStatusOptions } from '../../constants';
import { useSuggester } from '../../api';
import { useLocalisedText } from '../LocalisedText';

export const AppointmentsSearchBar = ({ onSearch }) => {
  const practitionerSuggester = useSuggester('practitioner');
  const locationGroupSuggester = useSuggester('facilityLocationGroup');
  const clinicianText = useLocalisedText({ path: 'fields.clinician.shortLabel' });

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
          <TranslatedText stringId="general.localisedFields.firstName.label" fallback="TODO" />
        }
        component={SearchField}
      />
      <LocalisedField name="lastName" component={SearchField} />
      <LocalisedField
        name="clinicianId"
        defaultLabel={clinicianText}
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
        size="small"
      />
      <LocalisedField
        name="status"
        defaultLabel="Appointment Status"
        component={SelectField}
        options={appointmentStatusOptions}
        size="small"
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
      <LocalisedField useShortLabel keepLetterCase name="displayId" component={SearchField} />
    </CustomisableSearchBar>
  );
};
