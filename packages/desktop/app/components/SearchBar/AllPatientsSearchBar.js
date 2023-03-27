import React from 'react';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import {
  AutocompleteField,
  CheckField,
  Field,
  LocalisedField,
  DisplayIdField,
  DOBFields,
} from '../Field';
import { useSuggester } from '../../api';

export const AllPatientsSearchBar = React.memo(({ onSearch, searchParameters }) => {
  const villageSuggester = useSuggester('village');
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
      <LocalisedField name="culturalName" />
      <LocalisedField name="villageId" component={AutocompleteField} suggester={villageSuggester} />
      <DisplayIdField />
      <DOBFields />
    </CustomisableSearchBar>
  );
});
