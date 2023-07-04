import React, { memo } from 'react';

import { generateId } from 'shared/utils/generateId';
import { Modal } from '../../../components';
import { NewPatientForm } from '../../../forms';
import { connectApi } from '../../../api';

const DumbNewPatientModal = memo(({ open, onCancel, ...formProps }) => (
  <Modal title="Add new patient" onClose={onCancel} open={open}>
    <NewPatientForm generateId={generateId} onCancel={onCancel} {...formProps} />
  </Modal>
));

export const NewPatientModal = connectApi((api, dispatch, { onCreateNewPatient }) => ({
  onSubmit: async data => {
    const newPatient = await api.post('patient', { ...data, registeredById: api.user.id });
    onCreateNewPatient(newPatient);
  },
}))(DumbNewPatientModal);
