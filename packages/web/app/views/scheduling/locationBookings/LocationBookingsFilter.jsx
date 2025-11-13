import React, { useEffect } from 'react';
import { debounce, omit } from 'lodash';
import { useFormikContext } from 'formik';
import styled from '@mui/system/styled';

import { USER_PREFERENCES_KEYS } from '@tamanu/constants';
import { Form, TextButton, TranslatedText } from '@tamanu/ui-components';

import { Field, SearchField} from '../../../components';
import { useTranslation } from '../../../contexts/Translation';
import { FilterField } from '../../../components/Field/FilterField';
import { useUserPreferencesMutation } from '../../../api/mutations';
import { useAuth } from '../../../contexts/Auth';
import {
  LOCATION_BOOKINGS_EMPTY_FILTER_STATE,
  useLocationBookingsContext,
} from '../../../contexts/LocationBookings';

const SearchBar = styled('search')`
  display: flex;
  gap: 0.5rem;
`;

const FormListener = () => {
  const { values } = useFormikContext();
  const { setFilters } = useLocationBookingsContext();
  useEffect(() => setFilters(values), [values, setFilters]);
};

export const LocationBookingsFilter = () => {
  const { filters, setFilters, viewType } = useLocationBookingsContext();
  const { getTranslation } = useTranslation();
  const { facilityId } = useAuth();

  const { mutateAsync: mutateUserPreferences } = useUserPreferencesMutation(facilityId);
  const updateUserPreferences = debounce(
    (values) =>
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
          <SearchBar data-testid="searchbar-lgtv">
            <Field
              name="patientNameOrId"
              component={SearchField}
              // Avoids [object Object] in the placeholder
              placeholder={getTranslation(
                'scheduling.filter.placeholder.patientNameOrId',
                'Search patient name or ID',
              )}
              style={{ width: '18.75rem' }}
              data-testid="field-e0qu"
            />
            <Field
              name="locationGroupIds"
              label={getTranslation('general.area.label', 'Area')}
              component={FilterField}
              endpoint="bookableLocationGroup"
              baseQueryParameters={{ isBookable: viewType }}
              onChange={(e) =>
                updateUserPreferences({ ...filters, locationGroupIds: e.target.value })
              }
              data-testid="field-67bz"
            />
            <Field
              name="clinicianId"
              label={getTranslation('general.localisedField.clinician.label.short', 'Clinician')}
              component={FilterField}
              endpoint="practitioner"
              onChange={(e) => updateUserPreferences({ ...filters, clinicianId: e.target.value })}
              data-testid="field-a99m"
            />
            <Field
              name="bookingTypeId"
              label={getTranslation('general.type.label', 'Type')}
              component={FilterField}
              endpoint="bookingType"
              onChange={(e) => updateUserPreferences({ ...filters, bookingTypeId: e.target.value })}
              data-testid="field-7bfo"
            />
            <TextButton
              onClick={() => {
                setValues(LOCATION_BOOKINGS_EMPTY_FILTER_STATE);
                setFilters(LOCATION_BOOKINGS_EMPTY_FILTER_STATE);
                updateUserPreferences(LOCATION_BOOKINGS_EMPTY_FILTER_STATE);
              }}
              style={{ textDecoration: 'underline', fontSize: '0.6875rem' }}
              data-testid="textbutton-xd2o"
            >
              <TranslatedText
                stringId="general.action.clear"
                fallback="Clear"
                data-testid="translatedtext-cque"
              />
            </TextButton>
          </SearchBar>
          <FormListener data-testid="formlistener-i0in" />
        </>
      )}
      data-testid="form-1bo8"
    />
  );
};
