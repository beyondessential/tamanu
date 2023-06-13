import React from 'react';
import * as yup from 'yup';
import { Modal } from './Modal';
import { ConfirmCancelRow } from './ButtonRow';
import { SelectField, Form, Field } from './Field';
import { FormGrid } from './FormGrid';

export const EditVitalCellModal = ({ value, onConfirm, onClose, open }) => (
  <Modal width="sm" title={value} onClose={onClose} open={open}>
    <Form
      onSubmit={onConfirm}
      validationSchema={yup.object().shape({
        reasonForCancellation: yup.string().required('Reason for cancellation is mandatory'),
      })}
      render={({
        // value: formValue,
        submitForm,
      }) => (
        <FormGrid columns={4}>
          <Field
            required
            component={SelectField}
            label="Reason for cancellation"
            name="reasonForCancellation"
            // options={options}
          />
          <ConfirmCancelRow onCancel={onClose} onConfirm={submitForm} confirmText="Save" />
        </FormGrid>
      )}
    />
  </Modal>
);
