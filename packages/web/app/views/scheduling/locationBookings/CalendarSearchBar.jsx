import React, { useEffect, useRef } from 'react';

import { styled } from '@mui/material';
import { Field, Form, SearchField, TextButton, TranslatedText } from '../../../components';
import { useTranslation } from '../../../contexts/Translation';
import { useFormikContext } from 'formik';
import { FilterField } from '../../../components/Field/FilterField';
import { useUserPreferencesQuery } from '../../../api/queries/useUserPreferencesQuery';

const SearchBar = styled('search')`
  display: flex;
  gap: 0.625rem;
`;

const FormListener = ({ onFilterChange }) => {
  const { values } = useFormikContext();
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip the first render to prevent overwriting database values
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    onFilterChange(values);
  }, [values, onFilterChange]);

  return null;
};

export const CalendarSearchBar = ({ initialFilters, onFilterChange }) => {
  const { getTranslation } = useTranslation();

  const { data: userPreferences } = useUserPreferencesQuery();

  return (
    <Form
      initialValues={{ ...userPreferences?.locationBookingFilters, patientNameOrId: '' }}
      onSubmit={async () => {}}
      render={({ clearForm }) => (
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
              name="locationGroupIds"
              label={getTranslation('general.area.label', 'Area')}
              component={FilterField}
              endpoint="bookableLocationGroup"
            />
            <Field
              name="clinicianId"
              label={getTranslation('general.localisedField.clinician.label.short', 'Clinician')}
              component={FilterField}
              endpoint="practitioner"
            />
            <Field
              name="bookingTypeId"
              label={getTranslation('general.type.label', 'Type')}
              component={FilterField}
              endpoint="bookingType"
            />
            <TextButton
              onClick={() => {
                clearForm();
              }}
              style={{ textDecoration: 'underline', fontSize: '0.6875rem' }}
            >
              <TranslatedText stringId="general.action.clear" fallback="Clear" />
            </TextButton>
          </SearchBar>
        </>
      )}
    />
  );
};
