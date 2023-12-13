import React from 'react';
import { useSuggester } from '../../api';
import { AutocompleteField, DOBFields, Field, LocalisedField, SearchField } from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { SearchBarCheckField } from './SearchBarCheckField';

export const CovidPatientsSearchBar = React.memo(({ onSearch }) => {
  const villageSuggester = useSuggester('village');

  return (
    <CustomisableSearchBar title="Search for Patients" onSearch={onSearch}>
      <LocalisedField name="firstName" component={SearchField} />
      <LocalisedField name="lastName" component={SearchField} />
      <LocalisedField name="villageId" component={AutocompleteField} suggester={villageSuggester} />
      <LocalisedField useShortLabel keepLetterCase name="displayId" component={SearchField} />
      <DOBFields />
      <Field name="clinicalStatus" label="Clinical status" component={SearchField} />
      <SearchBarCheckField name="deceased" label="Include deceased patients" />
    </CustomisableSearchBar>
  );
});
