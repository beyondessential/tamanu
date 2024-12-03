import React from 'react';
import styled from 'styled-components';

import { Field, Form, SearchField, TextButton, TranslatedText } from '../../../components';
import { FilterField } from '../../../components/Field/FilterField';
import { useOutpatientAppointmentsContext } from '../../../contexts/OutpatientAppointments';
import { useTranslation } from '../../../contexts/Translation';

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

export const OutpatientAppointmentsFilter = props => {
  const { setFilters } = useOutpatientAppointmentsContext();
  const { getTranslation } = useTranslation();

  const renderForm = ({ resetForm }) => (
    <Fieldset>
      <Field
        component={SearchField}
        name="patientNameOrId"
        onChange={e => setFilters(prev => ({ ...prev, patientNameOrId: e.target.value }))}
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
        onChange={e => setFilters(prev => ({ ...prev, locationGroupId: e.target.value }))}
      />
      <Field
        component={FilterField}
        endpoint="appointmentType"
        label={getTranslation('general.type.label', 'Type')}
        name="appointmentTypeId"
        onChange={e => setFilters(prev => ({ ...prev, appointmentTypeId: e.target.value }))}
      />
      <ResetButton onClick={resetForm} type="reset">
        <TranslatedText stringId="general.action.clear" fallback="Clear" />
      </ResetButton>
    </Fieldset>
  );

  return <Form onSubmit={async () => {}} render={renderForm} {...props} />;
};
