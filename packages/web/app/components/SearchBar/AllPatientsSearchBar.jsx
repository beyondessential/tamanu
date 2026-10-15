import React, { useState } from 'react';

import { SEX_LABELS, SEX_VALUES } from '@tamanu/constants';
import {
  AutocompleteField,
  DateField,
  Field,
  TranslatedSelectField,
  TranslatedText,
  useDateTime,
} from '@tamanu/ui-components';
import styled from 'styled-components';
import { useSuggester } from '../../api';
import { useSettings } from '../../contexts/Settings';
import { DOBFields, LocalisedField, QRCodeSearchField, SearchField } from '../Field';
import { AdditionalSearchField } from './AdditionalSearchField';
import { CustomisableSearchBarWithPermissionCheck } from './CustomisableSearchBar';
import { SearchBarCheckField } from './SearchBarCheckField';

const TwoColumnsField = styled.div`
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
  const additionalSearchFields = getSetting('patientSearch.additionalSearchFields') ?? [];
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
              />
            }
            data-testid="localisedfield-epbq"
          />
          <TwoColumnsField data-testid="twocolumnsfield-wg4x">
            <DOBFields showExactBirth={false} data-testid="dobfields-k8zn" />
            <SexLocalisedField
              name="sex"
              label={<TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />}
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
              />
            }
            data-testid="searchbarcheckfield-7dw8"
          />
          {additionalSearchFields.map(fieldName => (
            <AdditionalSearchField key={fieldName} fieldName={fieldName} />
          ))}
        </>
      }
      data-testid="customisablesearchbarwithpermissioncheck-al75"
    >
      <LocalisedField
        component={QRCodeSearchField}
        name="displayId"
        label={
          <TranslatedText stringId="general.localisedField.displayId.label.short" fallback="NHN" />
        }
        data-testid="localisedfield-dzml"
      />
      <LocalisedField
        component={SearchField}
        name="firstName"
        label={
          <TranslatedText stringId="general.localisedField.firstName.label" fallback="First name" />
        }
        data-testid="localisedfield-i9br"
      />
      <LocalisedField
        component={SearchField}
        name="lastName"
        label={
          <TranslatedText stringId="general.localisedField.lastName.label" fallback="Last name" />
        }
        data-testid="localisedfield-ngsn"
      />
      <Field
        name="dateOfBirthExact"
        component={DateField}
        label={<TranslatedText stringId="general.dateOfBirth.label.short" fallback="DOB" />}
        max={getCurrentDate()}
        data-testid="field-qk60"
      />
    </CustomisableSearchBarWithPermissionCheck>
  );
});
