import React, { useState } from 'react';
import Box from '@material-ui/core/Box';
import { useDateTime } from '@tamanu/ui-components';
import styled from 'styled-components';
import { CustomisableSearchBarWithPermissionCheck } from './CustomisableSearchBar';
import {
  AutocompleteField,
  DOBFields,
  Field,
  LocalisedField,
  SearchField,
  QRCodeSearchField,
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
  const { getCurrentDate } = useDateTime();
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
                fallback="Cultural/traditional name"
                data-testid="translatedtext-bcz1"
              />
            }
            data-testid="localisedfield-epbq"
          />
          <TwoColumnsField data-testid="twocolumnsfield-wg4x">
            <DOBFields showExactBirth={false} data-testid="dobfields-k8zn" />
            <SexLocalisedField
              name="sex"
              label={
                <TranslatedText
                  stringId="general.localisedField.sex.label"
                  fallback="Sex"
                  data-testid="translatedtext-uodm"
                />
              }
              component={TranslatedSelectField}
              transformOptions={options =>
                hideOtherSex ? options.filter(o => o.value !== SEX_VALUES.OTHER) : options
              }
              enumValues={SEX_LABELS}
              size="small"
              data-testid="sexlocalisedfield-7lm9"
            />
          </TwoColumnsField>
          <VillageLocalisedField
            name="villageId"
            label={
              <TranslatedText
                stringId="general.localisedField.villageId.label"
                fallback="Village"
                data-testid="translatedtext-3kz7"
              />
            }
            component={AutocompleteField}
            suggester={villageSuggester}
            size="small"
            data-testid="villagelocalisedfield-mcri"
          />
          <SearchBarCheckField
            name="deceased"
            label={
              <TranslatedText
                stringId="patientList.table.includeDeceasedCheckbox.label"
                fallback="Include deceased patients"
                data-testid="translatedtext-a68s"
              />
            }
            data-testid="searchbarcheckfield-7dw8"
          />
        </>
      }
      data-testid="customisablesearchbarwithpermissioncheck-al75"
    >
      <LocalisedField
        component={QRCodeSearchField}
        name="displayId"
        label={
          <TranslatedText
            stringId="general.localisedField.displayId.label.short"
            fallback="NHN"
            data-testid="translatedtext-d0eg"
          />
        }
        data-testid="localisedfield-dzml"
      />
      <LocalisedField
        component={SearchField}
        name="firstName"
        label={
          <TranslatedText
            stringId="general.localisedField.firstName.label"
            fallback="First name"
            data-testid="translatedtext-8yui"
          />
        }
        data-testid="localisedfield-i9br"
      />
      <LocalisedField
        component={SearchField}
        name="lastName"
        label={
          <TranslatedText
            stringId="general.localisedField.lastName.label"
            fallback="Last name"
            data-testid="translatedtext-hnon"
          />
        }
        data-testid="localisedfield-ngsn"
      />
      <Field
        name="dateOfBirthExact"
        component={DateField}
        saveDateAsString
        label={
          <TranslatedText
            stringId="general.dateOfBirth.label.short"
            fallback="DOB"
            data-testid="translatedtext-99pk"
          />
        }
        max={getCurrentDate()}
        data-testid="field-qk60"
      />
    </CustomisableSearchBarWithPermissionCheck>
  );
});
