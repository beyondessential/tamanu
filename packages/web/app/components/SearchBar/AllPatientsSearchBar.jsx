import React, { useState } from 'react';
import { getCurrentDateString } from '@tamanu/utils/dateTime';
import Box from '@material-ui/core/Box';
import styled from 'styled-components';
import { CustomisableSearchBarWithPermissionCheck } from './CustomisableSearchBar';
import {
  AutocompleteField,
  DOBFields,
  Field,
  LocalisedField,
  SearchField,
  TranslatedSelectField,
} from '../Field';
import { useSuggester } from '../../api';
import { DateField } from '../Field/DateField';
import { SearchBarCheckField } from './SearchBarCheckField';
import { TranslatedText } from '../Translation/TranslatedText';
import { SEX_LABELS, SEX_VALUES } from '@tamanu/constants';
import { useSettings } from '../../contexts/Settings';

const TwoColumnsField = styled(Box)`
  grid-column: span 2;
  display: flex;
  gap: 10px;
`;

const SexLocalisedField = styled(LocalisedField)`
  min-width: 100px;
  flex: 1;
`;

const VillageLocalisedField = styled(LocalisedField)`
  font-size: 11px;
`;

export const AllPatientsSearchBar = React.memo(({ onSearch, searchParameters }) => {
  const { getSetting } = useSettings();
  const villageSuggester = useSuggester('village');
  const hideOtherSex = getSetting('features.hideOtherSex') === true;
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  return (
    <CustomisableSearchBarWithPermissionCheck
      verb="list"
      noun="Patient"
      showExpandButton
      isExpanded={showAdvancedFields}
      setIsExpanded={setShowAdvancedFields}
      onSearch={onSearch}
      initialValues={searchParameters}
      hiddenFields={
        <>
          <LocalisedField
            component={SearchField}
            name="culturalName"
            label={
              <TranslatedText
                stringId="general.localisedField.culturalName.label.short"
                fallback="Cultural name"
                data-test-id='translatedtext-irz0' />
            }
            data-test-id='localisedfield-ih8i' />
          <TwoColumnsField>
            <DOBFields showExactBirth={false} />
            <SexLocalisedField
              name="sex"
              label={<TranslatedText
                stringId="general.localisedField.sex.label"
                fallback="Sex"
                data-test-id='translatedtext-ee6u' />}
              component={TranslatedSelectField}
              transformOptions={options =>
                hideOtherSex ? options.filter(o => o.value !== SEX_VALUES.OTHER) : options
              }
              enumValues={SEX_LABELS}
              size="small"
            />
          </TwoColumnsField>
          <VillageLocalisedField
            name="villageId"
            label={
              <TranslatedText
                stringId="general.localisedField.villageId.label"
                fallback="Village"
                data-test-id='translatedtext-e4pl' />
            }
            component={AutocompleteField}
            suggester={villageSuggester}
            size="small"
          />
          <SearchBarCheckField
            name="deceased"
            label={
              <TranslatedText
                stringId="patientList.table.includeDeceasedCheckbox.label"
                fallback="Include deceased patients"
                data-test-id='translatedtext-svx5' />
            }
          />
        </>
      }
    >
      <LocalisedField
        component={SearchField}
        name="displayId"
        label={
          <TranslatedText
            stringId="general.localisedField.displayId.label.short"
            fallback="NHN"
            data-test-id='translatedtext-hyg9' />
        }
        data-test-id='localisedfield-kal5' />
      <LocalisedField
        component={SearchField}
        name="firstName"
        label={
          <TranslatedText
            stringId="general.localisedField.firstName.label"
            fallback="First name"
            data-test-id='translatedtext-9uls' />
        }
        data-test-id='localisedfield-ybhi' />
      <LocalisedField
        component={SearchField}
        name="lastName"
        label={
          <TranslatedText
            stringId="general.localisedField.lastName.label"
            fallback="Last name"
            data-test-id='translatedtext-g4ky' />
        }
        data-test-id='localisedfield-4m1f' />
      <Field
        name="dateOfBirthExact"
        component={DateField}
        saveDateAsString
        label={<TranslatedText
          stringId="general.dateOfBirth.label"
          fallback="DOB"
          data-test-id='translatedtext-s7yj' />}
        max={getCurrentDateString()}
        data-test-id='field-ioko' />
    </CustomisableSearchBarWithPermissionCheck>
  );
});
