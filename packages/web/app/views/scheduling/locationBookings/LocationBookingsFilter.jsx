import React, { useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import styled from '@mui/system/styled';

import { Field, Form, SearchField, TextButton, TranslatedText } from '../../../components';
import { useTranslation } from '../../../contexts/Translation';
import { useFormikContext } from 'formik';
import { FilterField } from '../../../components/Field/FilterField';
import { useUserPreferencesQuery } from '../../../api/queries/useUserPreferencesQuery';
import { useAuth } from '../../../contexts/Auth';

const SearchBar = styled('search')`
  display: flex;
  gap: 0.625rem;
`;

const FormListener = ({ onFilterChange }) => {
  const { values } = useFormikContext();

  useEffect(() => {
    onFilterChange(values);
  }, [values, onFilterChange]);

  return null;
};

const emptyValues = {
  locationGroupIds: [],
  clinicianId: [],
  bookingTypeId: [],
  patientNameOrId: '',
};

export const LocationBookingsFilter = ({ onFilterChange }) => {
  const { getTranslation } = useTranslation();
  const { facilityId } = useAuth();

  const { data: userPreferences, isLoading: isUserPreferencesLoading } = useUserPreferencesQuery();

  if (isUserPreferencesLoading) {
    return <CircularProgress />;
  }

  return (
    <Form
      initialValues={userPreferences?.locationBookingFilters?.[facilityId]}
      onSubmit={async () => {}}
      render={({ setValues }) => (
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
                setValues(emptyValues);
                onFilterChange(emptyValues);
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
