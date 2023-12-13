import { startOfDay } from 'date-fns';
import React from 'react';
import { useSuggester } from '../../api';
import { appointmentStatusOptions, appointmentTypeOptions } from '../../constants';
import {
  AutocompleteField,
  DateTimeField,
  LocalisedField,
  SearchField,
  SelectField,
} from '../Field';
import { useLocalisedText } from '../LocalisedText';
import { CustomisableSearchBar } from './CustomisableSearchBar';

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
      <LocalisedField name="firstName" component={SearchField} />
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
