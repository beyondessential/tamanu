import React from 'react';

import { Form, Field, NumberField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

export const ManualLabResultForm = ({ onSubmit, onClose }) => {
  const renderForm = React.useCallback(({ submitForm }) => (
    <FormGrid columns={1}>
      <Field name="result" required component={NumberField} />
      <ConfirmCancelRow onConfirm={submitForm} onCancel={onClose} />
    </FormGrid>
  ));

  return <Form onSubmit={onSubmit} render={renderForm} />;
};
