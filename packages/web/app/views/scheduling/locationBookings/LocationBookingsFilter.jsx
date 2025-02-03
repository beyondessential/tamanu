import React, { useEffect } from 'react';
import styled from '@mui/system/styled';

import { Field, Form, SearchField, TextButton, TranslatedText } from '../../../components';
import { useTranslation } from '../../../contexts/Translation';
import { useFormikContext } from 'formik';
import { FilterField } from '../../../components/Field/FilterField';
import { USER_PREFERENCES_KEYS } from '@tamanu/constants';
import { debounce, omit } from 'lodash';
import { useUserPreferencesMutation } from '../../../api/mutations';
import { useAuth } from '../../../contexts/Auth';
import { useLocationBookingsContext } from '../../../contexts/LocationBookings';

const SearchBar = styled('search')`
  display: flex;
  gap: 0.625rem;
`;

const FormListener = () => {
  const { values } = useFormikContext();
  const { setFilters } = useLocationBookingsContext();
  useEffect(() => setFilters(values), [values, setFilters]);
};

const emptyValues = {
  locationGroupIds: [],
  clinicianId: [],
  bookingTypeId: [],
  patientNameOrId: '',
};

export const LocationBookingsFilter = () => {
  const { filters, setFilters } = useLocationBookingsContext();
  const { getTranslation } = useTranslation();
  const { facilityId } = useAuth();

  const { mutateAsync: mutateUserPreferences } = useUserPreferencesMutation(facilityId);
  const updateUserPreferences = debounce(
    values =>
      mutateUserPreferences({
        key: USER_PREFERENCES_KEYS.LOCATION_BOOKING_FILTERS,
        value: omit(values, ['patientNameOrId']),
      }),
    200,
  );

  return (
    <Form
      enableReinitialize
      initialValues={filters}
      onSubmit={async () => {}}
      render={({ setValues }) => (
        <>
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
              onChange={e =>
                updateUserPreferences({ ...filters, locationGroupIds: e.target.value })
              }
            />
            <Field
              name="clinicianId"
              label={getTranslation('general.localisedField.clinician.label.short', 'Clinician')}
              component={FilterField}
              endpoint="practitioner"
              onChange={e => updateUserPreferences({ ...filters, clinicianId: e.target.value })}
            />
            <Field
              name="bookingTypeId"
              label={getTranslation('general.type.label', 'Type')}
              component={FilterField}
              endpoint="bookingType"
              onChange={e => updateUserPreferences({ ...filters, bookingTypeId: e.target.value })}
            />
            <TextButton
              onClick={() => {
                setValues(emptyValues);
                setFilters(emptyValues);
                updateUserPreferences(emptyValues);
              }}
              style={{ textDecoration: 'underline', fontSize: '0.6875rem' }}
            >
              <TranslatedText stringId="general.action.clear" fallback="Clear" />
            </TextButton>
          </SearchBar>
          <FormListener />
        </>
      )}
    />
  );
};
