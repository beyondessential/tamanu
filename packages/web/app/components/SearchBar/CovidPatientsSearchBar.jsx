import React from 'react';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { AutocompleteField, DOBFields, Field, LocalisedField, SearchField } from '../Field';
import { useSuggester } from '../../api';
import { SearchBarCheckField } from './SearchBarCheckField';
import { TranslatedText } from '../Translation/TranslatedText';

export const CovidPatientsSearchBar = React.memo(({ onSearch }) => {
  const villageSuggester = useSuggester('village');

  return (
    <CustomisableSearchBar
      title="Search for Patients"
      onSearch={onSearch}
      data-testid='customisablesearchbar-csmg'>
      <LocalisedField
        name="firstName"
        label={
          <TranslatedText
            stringId="general.localisedField.firstName.label"
            fallback="First name"
            data-testid='translatedtext-6ohy' />
        }
        component={SearchField}
        data-testid='localisedfield-douf' />
      <LocalisedField
        name="lastName"
        label={
          <TranslatedText
            stringId="general.localisedField.lastName.label"
            fallback="Last name"
            data-testid='translatedtext-ge0r' />
        }
        component={SearchField}
        data-testid='localisedfield-1fv7' />
      <LocalisedField
        name="villageId"
        label={
          <TranslatedText
            stringId="general.localisedField.villageId.label"
            fallback="Village"
            data-testid='translatedtext-4m92' />
        }
        component={AutocompleteField}
        suggester={villageSuggester}
        data-testid='localisedfield-73yn' />
      <LocalisedField
        name="displayId"
        label={
          <TranslatedText
            stringId="general.localisedField.displayId.label.short"
            fallback="NHN"
            data-testid='translatedtext-hm7p' />
        }
        component={SearchField}
        data-testid='localisedfield-zc86' />
      <DOBFields data-testid='dobfields-hu8t' />
      <Field
        name="clinicalStatus"
        label={
          <TranslatedText
            stringId="general.clinicalStatus.label"
            fallback="Clinical status"
            data-testid='translatedtext-n6sk' />
        }
        component={SearchField}
        data-testid='field-bwh9' />
      <SearchBarCheckField
        name="deceased"
        label={
          <TranslatedText
            stringId="patientList.table.includeDeceasedCheckbox.label"
            fallback="Include deceased patients"
            data-testid='translatedtext-f2o1' />
        }
        data-testid='searchbarcheckfield-adiv' />
    </CustomisableSearchBar>
  );
});
