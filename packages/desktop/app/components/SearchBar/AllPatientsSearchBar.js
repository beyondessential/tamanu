import React, { useState } from 'react';
import { getCurrentDateString } from 'shared/utils/dateTime';
import Box from '@material-ui/core/Box';
import styled from 'styled-components';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import {
  AutocompleteField,
  CheckField,
  Field,
  LocalisedField,
  DisplayIdField,
  DOBFields,
  SearchField,
  SelectField,
} from '../Field';
import { useSuggester } from '../../api';
import { DateField } from '../Field/DateField';
import { useSexOptions } from '../../hooks';

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
  const sexOptions = useSexOptions(true);
  const [showAdvancedFields, setShowAdvancedFields] = useState();

  return (
    <CustomisableSearchBar
      variant="small"
      renderCheckField={
        <Field name="deceased" label="Include deceased patients" component={CheckField} />
      }
      showExpandButton
      isExpanded={showAdvancedFields}
      setIsExpanded={setShowAdvancedFields}
      onSearch={onSearch}
      initialValues={{ displayIdExact: true, ...searchParameters }}
    >
      <DisplayIdField />
      <LocalisedField component={SearchField} name="firstName" />
      <LocalisedField component={SearchField} name="lastName" />
      <Field
        name="dateOfBirthExact"
        component={DateField}
        saveDateAsString
        label="DOB"
        max={getCurrentDateString()}
      />
      {showAdvancedFields && (
        <>
          <LocalisedField component={SearchField} name="culturalName" />
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
        </>
      )}
    </CustomisableSearchBar>
  );
});
