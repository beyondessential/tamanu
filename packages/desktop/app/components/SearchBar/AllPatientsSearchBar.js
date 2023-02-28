import React from 'react';
import { getCurrentDateString } from 'shared/utils/dateTime';
import Box from '@material-ui/core/Box';
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

export const AllPatientsSearchBar = React.memo(({ onSearch, searchParameters }) => {
  const villageSuggester = useSuggester('village');
  const sexOptions = useSexOptions(true);
  const [showAdvancedFields, setShowAdvancedFields] = React.useState();

  return (
    <CustomisableSearchBar
      variant="small"
      renderCheckField={
        showAdvancedFields && (
          <Field name="deceased" label="Include deceased patients" component={CheckField} />
        )
      }
      showExpandButton
      onSearch={onSearch}
      initialValues={{ displayIdExact: true, ...searchParameters }}
      onExpandChange={expanded => {
        setShowAdvancedFields(expanded);
      }}
    >
      <DisplayIdField />
      <LocalisedField component={SearchField} name="firstName" />
      <LocalisedField component={SearchField} name="lastName" />
      <LocalisedField component={SearchField} name="culturalName" />
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
          <Box style={{ gridColumn: 'span 2', display: 'flex', gap: 10 }}>
            <DOBFields showExactBirth={false} />
            <LocalisedField
              style={{ minWidth: 100, flex: 1 }}
              name="sex"
              component={SelectField}
              options={sexOptions}
            />
          </Box>
          <LocalisedField
            name="villageId"
            component={AutocompleteField}
            suggester={villageSuggester}
            style={{ fontSize: '11px' }}
            size="small"
          />
        </>
      )}
    </CustomisableSearchBar>
  );
});
