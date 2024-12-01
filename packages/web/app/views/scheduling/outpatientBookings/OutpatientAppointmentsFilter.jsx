import React from 'react';
import styled from 'styled-components';

import { Field, Form, SearchField } from '../../../components';
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
  grid-template-columns: minmax(auto, 18rem) repeat(2, minmax(5.75rem, max-content));
`;

export const OutpatientAppointmentsFilter = props => {
  const { setFilters } = useOutpatientAppointmentsContext();
  const { getTranslation } = useTranslation();

  const renderForm = () => (
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
        endpoint="bookableLocationGroup"
        label={getTranslation('general.area.label', 'Area')}
        name="locationGroupIds"
        onChange={e => setFilters(prev => ({ ...prev, locationGroupIds: e.target.value }))}
      />
      <Field
        component={FilterField}
        endpoint="bookingType"
        label={getTranslation('general.type.label', 'Type')}
        name="bookingTypeId"
        onChange={e => setFilters(prev => ({ ...prev, bookingTypeId: e.target.value }))}
      />
    </Fieldset>
  );

  return <Form onSubmit={async () => {}} render={renderForm} {...props} />;
};
