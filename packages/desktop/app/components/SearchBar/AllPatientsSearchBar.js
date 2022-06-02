import React from 'react';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { DateField, AutocompleteField, CheckField, Field, LocalisedField } from '../Field';
import { useSuggester } from '../../api';
import { FingerprintButton } from '../FingerprintButton';

export const AllPatientsSearchBar = React.memo(({ onSearch }) => {
  const villageSuggester = useSuggester('village');
  return (
    <CustomisableSearchBar
      title="Search for patients"
      RightSection={FingerprintButton}
      renderCheckField={
        <Field name="deceased" label="Include deceased patients" component={CheckField} />
      }
      onSearch={onSearch}
    >
      <LocalisedField name="firstName" />
      <LocalisedField name="lastName" />
      <LocalisedField name="culturalName" />
      <LocalisedField name="villageId" component={AutocompleteField} suggester={villageSuggester} />
      <LocalisedField name="displayId" />
      <LocalisedField name="dateOfBirthFrom" component={DateField} />
      <LocalisedField name="dateOfBirthTo" component={DateField} />
      <LocalisedField name="dateOfBirthExact" />
    </CustomisableSearchBar>
  );
});
