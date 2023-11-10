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
            stringId="general.localisedFields.displayId.label"
            fallback="National Health Number"
          />
        }
      />
      <LocalisedField
        name="firstName"
        label={
          <TranslatedText
            stringId="general.localisedFields.firstName.label"
            fallback="First name"
          />
        }
      />
      <LocalisedField
        name="lastName"
        label={
          <TranslatedText stringId="general.localisedFields.lastName.label" fallback="Last name" />
        }
      />
      <LocalisedField
        name="villageId"
        label={
          <TranslatedText stringId="general.localisedFields.villageId.label" fallback="Village" />
        }
        component={AutocompleteField}
        suggester={villageSuggester}
      />
      <LocalisedField
        name="vaccinationStatus"
        defaultLabel="Vaccination Status"
        label={
          <TranslatedText
            stringId="general.localisedFields.vaccinationStatus"
            defaultLabel="Vaccination Status.label"
            fallback="TODO"
          />
        }
      />
    </CustomisableSearchBar>
  );
};
