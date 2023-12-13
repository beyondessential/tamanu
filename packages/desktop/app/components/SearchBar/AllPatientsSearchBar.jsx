import Box from '@material-ui/core/Box';
import { getCurrentDateString } from '@tamanu/shared/utils/dateTime';
import React, { useState } from 'react';
import styled from 'styled-components';
import { useSuggester } from '../../api';
import { useSexOptions } from '../../hooks';
import {
  AutocompleteField,
  DOBFields,
  Field,
  LocalisedField,
  SearchField,
  SelectField,
} from '../Field';
import { DateField } from '../Field/DateField';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { SearchBarCheckField } from './SearchBarCheckField';

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
  const villageSuggester = useSuggester('village');
  const sexOptions = useSexOptions(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  return (
    <CustomisableSearchBar
      showExpandButton
      isExpanded={showAdvancedFields}
      setIsExpanded={setShowAdvancedFields}
      onSearch={onSearch}
      initialValues={searchParameters}
      hiddenFields={
        <>
          <LocalisedField component={SearchField} name="culturalName" useShortLabel />
          <TwoColumnsField>
            <DOBFields showExactBirth={false} />
            <SexLocalisedField
              name="sex"
              component={SelectField}
              options={sexOptions}
              size="small"
            />
          </TwoColumnsField>
          <VillageLocalisedField
            name="villageId"
            component={AutocompleteField}
            suggester={villageSuggester}
            size="small"
          />
          <SearchBarCheckField name="deceased" label="Include deceased patients" />
        </>
      }
    >
      <LocalisedField useShortLabel keepLetterCase component={SearchField} name="displayId" />
      <LocalisedField component={SearchField} name="firstName" />
      <LocalisedField component={SearchField} name="lastName" />
      <Field
        name="dateOfBirthExact"
        component={DateField}
        saveDateAsString
        label="DOB"
        max={getCurrentDateString()}
      />
    </CustomisableSearchBar>
  );
});
