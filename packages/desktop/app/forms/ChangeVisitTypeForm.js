import React from 'react';

import {
  Form,
  Field,
  DateTimeField,
  AutocompleteField,
  TextField,
  CheckField,
  SelectField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';

const FormContents = ({ submitForm, onCancel, values }) => (
  <FormGrid columns={1}>
    <div>{`Changing visit to type ${values.visitType}`}</div>
    <ConfirmCancelRow onConfirm={submitForm} confirmText="Save" onCancel={onCancel} />
  </FormGrid>
);

export const ChangeVisitTypeForm = ({ visit, onSubmit, extraRoute, onCancel }) => {

  return (
    <Form
      initialValues={{
        visitType: extraRoute,
      }}
      render={FormContents}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  ); 
};
