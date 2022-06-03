import React from 'react';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import {
  DateField,
  AutocompleteField,
  CheckField,
  Field,
  LocalisedField,
  DisplayIdField,
} from '../Field';
import { useSuggester } from '../../api';

export const CovidPatientsSearchBar = React.memo(({ onSearch }) => {
  const villageSuggester = useSuggester('village');
  return (
    <CustomisableSearchBar
      title="Search for Patients"
      renderCheckField={
        <Field name="deceased" label="Include deceased patients" component={CheckField} />
      }
      onSearch={onSearch}
    >
      <LocalisedField name="firstName" />
      <LocalisedField name="lastName" />
      <LocalisedField name="villageId" component={AutocompleteField} suggester={villageSuggester} />
      <DisplayIdField />
      <Field name="dateOfBirthExact" component={DateField} label="DOB" />
      <Field name="dateOfBirthFrom" component={DateField} label="DOB from" />
      <Field name="dateOfBirthTo" component={DateField} label="DOB to" />
      <Field name="clinicalStatus" component={DateField} label="Clinical status" />
    </CustomisableSearchBar>
  );
});
