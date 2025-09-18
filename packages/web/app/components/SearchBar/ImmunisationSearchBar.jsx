import React from 'react';
import { SEX_LABELS, SEX_VALUES, VACCINE_STATUS } from '@tamanu/constants';
import styled from 'styled-components';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { useSuggester } from '../../api';
import {
  AutocompleteField,
  LocalisedField,
  SearchField,
} from '../Field';
import { TranslatedSelectField, SelectField } from '@tamanu/ui-components';
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
  const { getSetting } = useSettings();
  const villageSuggester = useSuggester('village');
  const hideOtherSex = getSetting('features.hideOtherSex') === true;

  return (
    <CustomisableSearchBar
      title="Search for Patients"
      onSearch={onSearch}
      data-testid="customisablesearchbar-s6h5"
    >
      <LocalisedField
        component={SearchField}
        name="displayId"
        label={
          <TranslatedText
            stringId="general.localisedField.displayId.label.short"
            fallback="NHN"
            data-testid="translatedtext-lr1l"
          />
        }
        data-testid="localisedfield-l1ab"
      />
      <LocalisedField
        component={SearchField}
        name="firstName"
        label={
          <TranslatedText
            stringId="general.localisedField.firstName.label"
            fallback="First name"
            data-testid="translatedtext-9k86"
          />
        }
        data-testid="localisedfield-y8fq"
      />
      <LocalisedField
        component={SearchField}
        name="lastName"
        label={
          <TranslatedText
            stringId="general.localisedField.lastName.label"
            fallback="Last name"
            data-testid="translatedtext-u536"
          />
        }
        data-testid="localisedfield-22w0"
      />
      <LocalisedField
        name="sex"
        label={
          <TranslatedText
            stringId="general.localisedField.sex.label"
            fallback="Sex"
            data-testid="translatedtext-f4ri"
          />
        }
        component={TranslatedSelectField}
        transformOptions={(options) =>
          hideOtherSex ? options.filter((o) => o.value !== SEX_VALUES.OTHER) : options
        }
        enumValues={SEX_LABELS}
        size="small"
        data-testid="localisedfield-o6kg"
      />
      <Spacer data-testid="spacer-0dgh" />
      <LocalisedField
        name="villageId"
        label={
          <TranslatedText
            stringId="general.localisedField.villageId.label"
            fallback="Village"
            data-testid="translatedtext-vqig"
          />
        }
        component={AutocompleteField}
        suggester={villageSuggester}
        data-testid="localisedfield-0g4y"
      />
      <LocalisedField
        component={SelectField}
        prefix="vaccine.property.status"
        name="status"
        label={
          <TranslatedText
            stringId="general.localisedField.vaccineStatus.label"
            fallback="Status"
            data-testid="translatedtext-3wip"
          />
        }
        options={statusOptions}
        size="small"
        data-testid="localisedfield-77r0"
      />
      <Spacer data-testid="spacer-r0c0" />
      <Spacer data-testid="spacer-ry81" />
    </CustomisableSearchBar>
  );
};
