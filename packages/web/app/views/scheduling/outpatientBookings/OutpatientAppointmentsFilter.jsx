import { useFormikContext } from 'formik';
import React, { useEffect } from 'react';
import styled from 'styled-components';

import { Form, TextButton, TranslatedText } from '@tamanu/ui-components';

import { Field, SearchField } from '../../../components';
import { FilterField } from '../../../components/Field/FilterField';
import {
  OUTPATIENT_APPOINTMENTS_EMPTY_FILTER_STATE,
  useOutpatientAppointmentsContext,
} from '../../../contexts/OutpatientAppointments';
import { useTranslation } from '../../../contexts/Translation';
import { APPOINTMENT_GROUP_BY } from './OutpatientAppointmentsView';

const Fieldset = styled.fieldset`
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

const FormFields = () => {
  const { getTranslation } = useTranslation();
  const { groupBy, setFilters } = useOutpatientAppointmentsContext();
  const { setValues } = useFormikContext();

  return (
    <Fieldset data-testid="fieldset-gbat">
      <Field
        component={SearchField}
        name="patientNameOrId"
        placeholder={getTranslation(
          'scheduling.filter.placeholder.patientNameOrId',
          'Search patient name or ID',
        )}
        data-testid="field-keyw"
      />
      {groupBy === APPOINTMENT_GROUP_BY.LOCATION_GROUP && (
        <Field
          component={FilterField}
          endpoint="facilityLocationGroup"
          label={getTranslation('general.area.label', 'Area')}
          name="locationGroupId"
          data-testid="field-fqlx"
        />
      )}
      {groupBy === APPOINTMENT_GROUP_BY.CLINICIAN && (
        <Field
          component={FilterField}
          endpoint="practitioner"
          label={getTranslation('general.localisedField.clinician.label.short', 'Clinician')}
          name="clinicianId"
          data-testid="field-0uvt"
        />
      )}
      <Field
        component={FilterField}
        endpoint="appointmentType"
        label={getTranslation('general.type.label', 'Type')}
        name="appointmentTypeId"
        data-testid="field-0jh8"
      />
      <ResetButton
        onClick={() => {
          setValues(OUTPATIENT_APPOINTMENTS_EMPTY_FILTER_STATE);
          setFilters(OUTPATIENT_APPOINTMENTS_EMPTY_FILTER_STATE);
        }}
        type="reset"
        data-testid="resetbutton-aw9o"
      >
        <TranslatedText
          stringId="general.action.clear"
          fallback="Clear"
          data-testid="translatedtext-1ml9"
        />
      </ResetButton>
      <FormListener data-testid="formlistener-eeyr" />
    </Fieldset>
  );
};

export const OutpatientAppointmentsFilter = (props) => {
  const { filters } = useOutpatientAppointmentsContext();
  return (
    <Form
      enableReinitialize
      initialValues={filters}
      onSubmit={async () => {}}
      render={() => <FormFields data-testid="formfields-485s" />}
      {...props}
      data-testid="form-eoaj"
    />
  );
};
