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

const SearchBar = styled('search')`
  display: flex;
  gap: 1rem;
`;

export const CalendarSearchBar = () => {
  const { getTranslation } = useTranslation();

  return (
    <Form
      onSubmit={async () => {}}
      render={() => (
        <Field
          name="patientNameOrId"
          component={SearchField}
          placeholder={getTranslation(
            'scheduling.filter.placeholder.patientNameOrId',
            'Search patient name or ID',
          )} // Avoids [object Object] in the placeholder
          style={{ width: '18.75rem' }}
        />
      )}
    />
  );
};
