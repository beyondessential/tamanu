import React from 'react';

import { Box, styled } from '@mui/material';
import {
  CustomisableSearchBar,
  Field,
  Form,
  SearchField,
  TranslatedText,
} from '../../../components';
import { useTranslation } from '../../../contexts/Translation';
import FilterField from '../../../components/Field/FilterField';
import { SearchMultiSelectField } from '../../../components/Field/SearchMultiSelectField';
import { Formik } from 'formik';

const SearchBar = styled('search')`
  display: flex;
  gap: 1rem;
`;

const options = [
  { label: 'Option 1', value: 'option1' },
  { label: 'Option 2', value: 'option2' },
  { label: 'Option 3', value: 'option3' },
  { label: 'Option 4', value: 'option4' },
  { label: 'Option 5', value: 'option5' },
  { label: 'Option 6', value: 'option6' },
  { label: 'Option 7', value: 'option7' },
  { label: 'Option 8', value: 'option8' },
  { label: 'Option 9', value: 'option9' },
  { label: 'Option 10', value: 'option10' },
];

export const CalendarSearchBar = () => {
  const { getTranslation } = useTranslation();

  return (
    <Formik
      initialValues={{
        selectedOptions: [],
        patientNameOrId: '',
      }}
    >
      <Form
        onSubmit={async () => {}}
        render={() => (
          <SearchBar>
            <Field
              name="patientNameOrId"
              component={SearchField}
              placeholder={getTranslation(
                'scheduling.filter.placeholder.patientNameOrId',
                'Search patient name or ID',
              )} // Avoids [object Object] in the placeholder
              style={{ width: '18.75rem' }}
            />
            <Field
              name="selectedOptions"
              label={<TranslatedText stringId="hi" fallback="hihihi" />}
              options={options}
              component={SearchMultiSelectField}
            />
          </SearchBar>
        )}
      />
    </Formik>
  );
};
