import React from 'react';
import { VACCINE_STATUS } from '@tamanu/constants';
import styled from 'styled-components';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useSuggester } from '../../api';
import {
  AutocompleteField,
  CheckField,
  Field,
  LocalisedField,
  SearchField,
  SelectField,
} from '../Field';
import { TranslatedText } from '../Translation';
import { useSexOptions } from '../../hooks';

const Spacer = styled.div`
  width: 100%;
`;

const FacilityCheckbox = styled.div`
  display: flex;
  align-items: center;
  margin-top: 20px;
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
  const villageSuggester = useSuggester('village');
  const sexOptions = useSexOptions(false);

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
        component={SelectField}
        options={sexOptions}
        size="small"
        prefix="patient.property.sex"
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
      <FacilityCheckbox>
        <Field name="allFacilities" label="Include all facilities" component={CheckField} />
      </FacilityCheckbox>
      <Spacer />
    </CustomisableSearchBar>
  );
};
