import React from 'react';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { AutocompleteField, DOBFields, Field, LocalisedField, SearchField } from '../Field';
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
        name="villageId"
        label={
          <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />
        }
        component={AutocompleteField}
        suggester={villageSuggester}
      />
      <LocalisedField
        name="displayId"
        label={
          <TranslatedText stringId="general.localisedField.displayId.label.short" fallback="NHN" />
        }
        component={SearchField}
      />
      <DOBFields />
      <Field
        name="clinicalStatus"
        label={
          <TranslatedText stringId="general.clinicalStatus.label" fallback="Clinical status" />
        }
        component={SearchField}
      />
      <SearchBarCheckField
        name="deceased"
        label={
          <TranslatedText
            stringId="patientList.table.includeDeceasedCheckbox.label"
            fallback="Include deceased patients"
          />
        }
      />
    </CustomisableSearchBar>
  );
});
