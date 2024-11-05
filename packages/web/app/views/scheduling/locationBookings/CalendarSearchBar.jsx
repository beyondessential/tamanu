import React, { useEffect } from 'react';

import { styled } from '@mui/material';
import { Field, Form, SearchField } from '../../../components';
import { useTranslation } from '../../../contexts/Translation';
import { SuggesterSearchMultiSelectField } from '../../../components/Field/SearchMultiSelectField';
import { Formik, useFormikContext } from 'formik';
import { FilterField } from '../../../components/Field/FilterField';

const SearchBar = styled('search')`
  display: flex;
  gap: 1rem;
`;

const FormListener = ({ onFilterChange }) => {
  const { values } = useFormikContext();

  useEffect(() => {
    onFilterChange(values);
  }, [values, onFilterChange]);
};

export const CalendarSearchBar = ({ onFilterChange }) => {
  const { getTranslation } = useTranslation();

  return (
    <Formik enableReinitialize>
      <Form
        onSubmit={async () => {}}
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
            </SearchBar>
          </>
        )}
      />
    </Formik>
  );
};
