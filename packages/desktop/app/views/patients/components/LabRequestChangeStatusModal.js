import React from 'react';
import * as yup from 'yup';

import { LAB_REQUEST_STATUSES } from 'shared/constants';

import { ConfirmCancelRow, Form, FormGrid, Modal, SelectField, Field } from '../../../components';
import { LAB_REQUEST_STATUS_OPTIONS } from '../../../constants';

const validationSchema = yup.object().shape({
  status: yup
    .string()
    .oneOf(Object.values(LAB_REQUEST_STATUSES))
    .required(),
});

export const LabRequestChangeStatusModal = React.memo(
  ({ status: currentStatus, updateLabReq, open, onClose }) => {
    const updateLabStatus = async ({ status }) => {
      await updateLabReq({ status });
      onClose();
    };

    return (
      <>
        <Modal open={open} onClose={onClose} title="Change lab request status">
          <Form
            onSubmit={updateLabStatus}
            validationSchema={validationSchema}
            initialValues={{
              status: currentStatus,
            }}
            render={({ submitForm }) => (
              <FormGrid columns={1}>
                <Field
                  label="Status"
                  name="status"
                  options={LAB_REQUEST_STATUS_OPTIONS}
                  component={SelectField}
                  required
                />
                <ConfirmCancelRow onConfirm={submitForm} confirmText="Save" onCancel={onClose} />
              </FormGrid>
            )}
          />
        </Modal>
      </>
    );
  },
);
