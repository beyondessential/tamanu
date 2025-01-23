import { useFormikContext } from 'formik';
import { debounce, omit } from 'lodash';
import React, { useEffect } from 'react';
import styled from 'styled-components';

import { USER_PREFERENCES_KEYS } from '@tamanu/constants';

import { useUserPreferencesMutation } from '../../../api/mutations';
import { Field, Form, SearchField, TextButton, TranslatedText } from '../../../components';
import { FilterField } from '../../../components/Field/FilterField';
import {
  OUTPATIENT_APPOINTMENTS_EMPTY_FILTER_STATE,
  useOutpatientAppointmentsContext,
} from '../../../contexts/OutpatientAppointments';
import { useTranslation } from '../../../contexts/Translation';
import { useAuth } from '../../../contexts/Auth';

const Fieldset = styled.fieldset`
  // Reset
  border: none;
  margin: 0;
  padding: 0;

  display: grid;
  gap: 0.625rem;
  grid-template-columns: minmax(auto, 18rem) repeat(2, minmax(5.75rem, max-content)) auto;
`;

const ResetButton = styled(TextButton).attrs({
  type: 'reset',
})`
  font-size: 0.6875rem;

  &,
  &:hover {
    text-decoration: underline;
  }
`;

/**
 * @privateRemarks Formik doesn’t call change handlers when the form is reinitialised, so we resort
 * to using `useEffect`. Otherwise, when `outpatientAppointmentFilters` is initially loaded, it
 * doesn’t get reflected in the displayed appointments (only in the form fields).
 */
const FormListener = () => {
  const { values } = useFormikContext();
  const { setFilters } = useOutpatientAppointmentsContext();
  useEffect(() => setFilters(values), [values, setFilters]);
};

export const OutpatientAppointmentsFilter = props => {
  const { filters, setFilters } = useOutpatientAppointmentsContext();
  const { getTranslation } = useTranslation();
  const { facilityId } = useAuth();

  const { mutateAsync: mutateUserPreferences } = useUserPreferencesMutation(facilityId);
  const updateUserPreferences = debounce(
    values =>
      mutateUserPreferences({
        key: USER_PREFERENCES_KEYS.OUTPATIENT_APPOINTMENT_FILTERS,
        value: omit(values, ['patientNameOrId']),
      }),
    200,
  );

  const renderForm = ({ setValues }) => {
    return (
      <Fieldset>
        <Field
          component={SearchField}
          name="patientNameOrId"
          placeholder={getTranslation(
            'scheduling.filter.placeholder.patientNameOrId',
            'Search patient name or ID',
          )}
        />
        <Field
          component={FilterField}
          endpoint="facilityLocationGroup"
          label={getTranslation('general.area.label', 'Area')}
          name="locationGroupId"
          onChange={e => updateUserPreferences({ ...filters, locationGroupId: e.target.value })}
        />
        <Field
          component={FilterField}
          endpoint="appointmentType"
          label={getTranslation('general.type.label', 'Type')}
          name="appointmentTypeId"
          onChange={e => updateUserPreferences({ ...filters, appointmentTypeId: e.target.value })}
        />
        <ResetButton
          onClick={() => {
            setValues(OUTPATIENT_APPOINTMENTS_EMPTY_FILTER_STATE);
            setFilters(OUTPATIENT_APPOINTMENTS_EMPTY_FILTER_STATE);
            updateUserPreferences(OUTPATIENT_APPOINTMENTS_EMPTY_FILTER_STATE);
          }}
          type="reset"
        >
          <TranslatedText stringId="general.action.clear" fallback="Clear" />
        </ResetButton>
        <FormListener />
      </Fieldset>
    );
  };

  return (
    <Form
      enableReinitialize
      initialValues={filters}
      onSubmit={async () => {}}
      render={renderForm}
      {...props}
    />
  );
};
