import React from 'react';
import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { reloadLab } from '../store/labRequest';

import { Form, Field, NumberField } from './Field';
import { FormGrid } from './FormGrid';
import { ConfirmCancelRow } from './ButtonRow';

const ManualResultForm = ({ labTest, onSubmit, onClose }) => {
  const renderForm = React.useCallback(({ submitForm }) => (
    <FormGrid columns={1}>
      <Field name="result" required component={NumberField} />
      <ConfirmCancelRow onConfirm={submitForm} onCancel={onClose} />
    </FormGrid>
  ));

  return <Form onSubmit={onSubmit} render={renderForm} />;
};

export const ManualLabResultModal = connectApi((api, dispatch, { labTest, labRequest }) => ({
  onSubmit: async data => {
    await api.put(`labTest/${labTest._id}`, { result: `${data.result}` });
    dispatch(reloadLab(labRequest._id));
  },
}))(({ open, labTest, onClose, onSubmit }) => (
  <Modal open={!!labTest} onClose={onClose} title="Enter lab result">
    <ManualResultForm labTest={labTest} onSubmit={onSubmit} onClose={onClose} />
  </Modal>
));
