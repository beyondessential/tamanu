import React from 'react';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { AutocompleteField, Field, LocalisedField, DisplayIdField, DOBFields } from '../Field';
import { useSuggester } from '../../api';
import { SearchBarCheckField } from './SearchBarCheckField';

export const CovidPatientsSearchBar = React.memo(({ onSearch }) => {
  const villageSuggester = useSuggester('village');
  return (
    <CustomisableSearchBar
      title="Search for Patients"
      onSearch={onSearch}
      initialValues={{ displayIdExact: true }}
    >
      <LocalisedField name="firstName" />
      <LocalisedField name="lastName" />
      <LocalisedField name="villageId" component={AutocompleteField} suggester={villageSuggester} />
      <DisplayIdField />
      <DOBFields />
      <Field name="clinicalStatus" label="Clinical status" />
      <SearchBarCheckField name="deceased" label="Include deceased patients" />
    </CustomisableSearchBar>
  );
});
