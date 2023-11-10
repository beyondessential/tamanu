import React from 'react';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { AutocompleteField, Field, LocalisedField, DOBFields, SearchField } from '../Field';
import { useSuggester } from '../../api';
import { SearchBarCheckField } from './SearchBarCheckField';
import { TranslatedText } from '../Translation/TranslatedText';

export const CovidPatientsSearchBar = React.memo(({ onSearch }) => {
  const villageSuggester = useSuggester('village');

  return (
    <CustomisableSearchBar title="Search for Patients" onSearch={onSearch}>
      <LocalisedField
        name="firstName"
        label={
          <TranslatedText stringId="general.localisedFields.firstName.label" fallback="TODO" />
        }
        component={SearchField}
      />
      <LocalisedField
        name="lastName"
        label={<TranslatedText stringId="general.localisedFields.lastName.label" fallback="TODO" />}
        component={SearchField}
      />
      <LocalisedField
        name="villageId"
        label={
          <TranslatedText stringId="general.localisedFields.villageId.label" fallback="TODO" />
        }
        component={AutocompleteField}
        suggester={villageSuggester}
      />
      <LocalisedField
        useShortLabel
        keepLetterCase
        name="displayId"
        label={
          <TranslatedText stringId="general.localisedFields.displayId.label" fallback="TODO" />
        }
        component={SearchField}
      />
      <DOBFields />
      <Field name="clinicalStatus" label="Clinical status" component={SearchField} />
      <SearchBarCheckField name="deceased" label="Include deceased patients" />
    </CustomisableSearchBar>
  );
});
