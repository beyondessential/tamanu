import React from 'react';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useSuggester } from '../../api';
import { AutocompleteField, LocalisedField } from '../Field';
import { TranslatedText } from '../Translation/TranslatedText';

export const ImmunisationSearchBar = ({ onSearch }) => {
  const villageSuggester = useSuggester('village');

  return (
    <CustomisableSearchBar title="Search for Patients" onSearch={onSearch}>
      <LocalisedField
        name="displayId"
        label={
          <TranslatedText
            stringId="general.localisedField.displayId.label"
            fallback="National Health Number"
          />
        }
      />
      <LocalisedField
        name="firstName"
        label={
          <TranslatedText stringId="general.localisedField.firstName.label" fallback="First name" />
        }
      />
      <LocalisedField
        name="lastName"
        label={
          <TranslatedText stringId="general.localisedField.lastName.label" fallback="Last name" />
        }
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
        name="vaccinationStatus"
        defaultLabel="Vaccination Status"
        label={
          <TranslatedText
            stringId="general.localisedField.vaccinationStatus.label"
            fallback="Vaccination Status"
          />
        }
      />
    </CustomisableSearchBar>
  );
};
