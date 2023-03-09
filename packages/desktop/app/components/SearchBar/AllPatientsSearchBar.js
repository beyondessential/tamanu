import React from 'react';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import {
  AutocompleteField,
  CheckField,
  Field,
  LocalisedField,
  DisplayIdField,
  DOBFields,
  SearchField,
} from '../Field';
import { useSuggester } from '../../api';

export const AllPatientsSearchBar = React.memo(({ onSearch, searchParameters }) => {
  const villageSuggester = useSuggester('village');
  return (
    <CustomisableSearchBar
      title="Search for Patients"
      variant="small"
      renderCheckField={
        <Field name="deceased" label="Include deceased patients" component={CheckField} />
      }
      onSearch={onSearch}
      initialValues={{ displayIdExact: true, ...searchParameters }}
    >
      <LocalisedField component={SearchField} name="firstName" />
      <LocalisedField component={SearchField} name="lastName" />
      <LocalisedField component={SearchField} name="culturalName" />
      <LocalisedField
        name="villageId"
        component={AutocompleteField}
        suggester={villageSuggester}
        size="small"
      />
      <DisplayIdField />
      <DOBFields />
    </CustomisableSearchBar>
  );
});
