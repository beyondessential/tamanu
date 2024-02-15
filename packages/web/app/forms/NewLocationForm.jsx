import React, { memo, useCallback } from 'react';
import * as yup from 'yup';

import { Field, Form, TextField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ModalFormActionRow } from '../components/ModalActionRow';
import { FORM_TYPES } from '../constants';

export const NewLocationForm = memo(({ editedObject, onSubmit, onCancel }) => {
  const renderForm = useCallback(
    ({ submitForm }) => (
      <FormGrid>
        <Field name="name" label="Location name" component={TextField} required />
        <ModalFormActionRow confirmText="Create" onConfirm={submitForm} onCancel={onCancel} />
      </FormGrid>
    ),
    [onCancel],
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      formType={editedObject ? FORM_TYPES.EDIT_FORM: FORM_TYPES.CREATE_FORM}
      initialValues={editedObject}
      validationSchema={yup.object().shape({
        name: yup.string().required(),
      })}
    />
  );
});
