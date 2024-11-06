import React from 'react';
import { SEX_LABELS, SEX_VALUES, VACCINE_STATUS } from '@tamanu/constants';
import styled from 'styled-components';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useSuggester } from '../../api';
import {
  AutocompleteField,
  LocalisedField,
  SearchField,
  SelectField,
  TranslatedSelectField,
} from '../Field';
import { TranslatedText } from '../Translation';
import { useSettings } from '../../contexts/Settings';

const Spacer = styled.div`
  flex: 1;

  @media (max-width: 1200px) {
    display: none;
  }
`;

// Only some of the statuses are used in the search bar
const VACCINE_STATUS_LABELS = {
  [VACCINE_STATUS.SCHEDULED]: 'Scheduled',
  [VACCINE_STATUS.DUE]: 'Due',
  [VACCINE_STATUS.UPCOMING]: 'Upcoming',
  [VACCINE_STATUS.OVERDUE]: 'Overdue',
};

const statusOptions = Object.entries(VACCINE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export const ImmunisationSearchBar = ({ onSearch }) => {
  const { getSetting } = useSettings()
  const villageSuggester = useSuggester('village');
  const hideOtherSex = getSetting('features.hideOtherSex') === true;

  return (
    <CustomisableSearchBar title="Search for Patients" onSearch={onSearch}>
      <LocalisedField
        component={SearchField}
        name="displayId"
        label={
          <TranslatedText stringId="general.localisedField.displayId.label.short" fallback="NHN" />
        }
      />
      <LocalisedField
        component={SearchField}
        name="firstName"
        label={
          <TranslatedText stringId="general.localisedField.firstName.label" fallback="First name" />
        }
      />
      <LocalisedField
        component={SearchField}
        name="lastName"
        label={
          <TranslatedText stringId="general.localisedField.lastName.label" fallback="Last name" />
        }
      />
      <LocalisedField
        name="sex"
        label={<TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />}
        component={TranslatedSelectField}
        transformOptions={options =>
          hideOtherSex ? options.filter(o => o.value !== SEX_VALUES.OTHER) : options
        }
        enumValues={SEX_LABELS}
        size="small"
      />
      <Spacer />
      <LocalisedField
        name="villageId"
        label={
          <TranslatedText stringId="general.localisedField.villageId.label" fallback="Village" />
        }
        component={AutocompleteField}
        suggester={villageSuggester}
      />
      <LocalisedField
        component={SelectField}
        prefix="vaccine.property.status"
        name="status"
        label={
          <TranslatedText stringId="general.localisedField.vaccineStatus.label" fallback="Status" />
        }
        options={statusOptions}
        size="small"
      />
      <Spacer />
      <Spacer />
    </CustomisableSearchBar>
  );
};
