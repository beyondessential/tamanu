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
          <TranslatedText
            stringId="general.localisedField.firstName.label"
            fallback="First name"
            data-test-id='translatedtext-xi9c' />
        }
        component={SearchField}
        data-test-id='localisedfield-aihu' />
      <LocalisedField
        name="lastName"
        label={
          <TranslatedText
            stringId="general.localisedField.lastName.label"
            fallback="Last name"
            data-test-id='translatedtext-wldj' />
        }
        component={SearchField}
        data-test-id='localisedfield-3dl2' />
      <LocalisedField
        name="villageId"
        label={
          <TranslatedText
            stringId="general.localisedField.villageId.label"
            fallback="Village"
            data-test-id='translatedtext-5sdv' />
        }
        component={AutocompleteField}
        suggester={villageSuggester}
        data-test-id='localisedfield-amr7' />
      <LocalisedField
        name="displayId"
        label={
          <TranslatedText
            stringId="general.localisedField.displayId.label.short"
            fallback="NHN"
            data-test-id='translatedtext-qkee' />
        }
        component={SearchField}
        data-test-id='localisedfield-x5c4' />
      <DOBFields />
      <Field
        name="clinicalStatus"
        label={
          <TranslatedText
            stringId="general.clinicalStatus.label"
            fallback="Clinical status"
            data-test-id='translatedtext-0o9l' />
        }
        component={SearchField}
        data-test-id='field-l0mh' />
      <SearchBarCheckField
        name="deceased"
        label={
          <TranslatedText
            stringId="patientList.table.includeDeceasedCheckbox.label"
            fallback="Include deceased patients"
            data-test-id='translatedtext-njhx' />
        }
      />
    </CustomisableSearchBar>
  );
});
