import React from 'react';
import styled from 'styled-components';

import { Field, Form, SearchField } from '../../../components';
import { FilterField } from '../../../components/Field/FilterField';
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
  const { getTranslation } = useTranslation();

  const renderForm = () => {
    return (
      <Fieldset>
        <Field
          name="patientNameOrId"
          component={SearchField}
          placeholder={getTranslation(
            'scheduling.filter.placeholder.patientNameOrId',
            'Search patient name or ID',
          )}
        />
        <Field
          name="locationGroupIds"
          label={getTranslation('general.area.label', 'Area')}
          component={FilterField}
          endpoint="bookableLocationGroup"
        />
        <Field
          name="bookingTypeId"
          label={getTranslation('general.type.label', 'Type')}
          component={FilterField}
          endpoint="bookingType"
        />
      </Fieldset>
    );
  };

  return <Form onSubmit={async () => {}} render={renderForm} {...props} />;
};
