import React, { useEffect } from 'react';

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
import { Formik, useFormikContext } from 'formik';

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

const FormListener = ({ onFilterChange }) => {
  const { values } = useFormikContext();

  useEffect(() => {
    onFilterChange(values);
  }, [values, onFilterChange]);
};

export const CalendarSearchBar = ({ onFilterChange }) => {
  const { getTranslation } = useTranslation();

  return (
    <Formik
      initialValues={{
        selectedOptions: [],
        patientNameOrId: '',
      }}
      enableReinitialize
    >
      <Form
        render={() => (
          <>
            <FormListener onFilterChange={onFilterChange} />
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
                name="area"
                label={getTranslation('general.area.label', 'Area')}
                options={options}
                component={SearchMultiSelectField}
              />
              <Field
                name="clinician"
                label={getTranslation('general.localisedField.clinician.label.short', 'Clinician')}
                options={options}
                component={SearchMultiSelectField}
              />
              <Field
                name="type"
                label={getTranslation('general.type.label', 'Type')}
                options={options}
                component={SearchMultiSelectField}
              />
            </SearchBar>
          </>
        )}
      />
    </Formik>
  );
};
