import React, { useState } from 'react';
import { getCurrentDateString } from '@tamanu/shared/utils/dateTime';
import Box from '@material-ui/core/Box';
import styled from 'styled-components';
import { CustomisableSearchBarWithPermissionCheck } from './CustomisableSearchBar';
import { AutocompleteField, DOBFields, Field, LocalisedField, SearchField } from '../Field';
import { useSuggester } from '../../api';
import { DateField } from '../Field/DateField';
import { SearchBarCheckField } from './SearchBarCheckField';
import { TranslatedText } from '../Translation/TranslatedText';
import { TranslatedSelectField } from '../Translation/TranslatedSelect';
import { SEX_LABELS, SEX_VALUES } from '@tamanu/constants';
import { useLocalisation } from '../../contexts/Localisation';

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
  const { getLocalisation } = useLocalisation();
  const villageSuggester = useSuggester('village');
  const hideOtherSex = getLocalisation('features.hideOtherSex') === true;
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
              />
            }
          />
          <TwoColumnsField>
            <DOBFields showExactBirth={false} />
            <SexLocalisedField
              name="sex"
              label={<TranslatedText stringId="general.localisedField.sex.label" fallback="Sex" />}
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
              />
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
              />
            }
          />
        </>
      }
    >
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
      <Field
        name="dateOfBirthExact"
        component={DateField}
        saveDateAsString
        label={<TranslatedText stringId="general.dateOfBirth.label" fallback="DOB" />}
        max={getCurrentDateString()}
      />
    </CustomisableSearchBarWithPermissionCheck>
  );
});
