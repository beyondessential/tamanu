import React, { memo } from 'react';

import { Modal } from '../../../components';
import { NewPatientForm } from '../../../forms';
import { connectApi } from '../../../api';

import { generateId } from '../../../../../shared/utils/generateId';

const DumbNewPatientModal = memo(({ open, onCancel, isBirth, ...formProps }) => (
  <Modal title={isBirth ? 'Record new birth' : 'Create new patient'} onClose={onCancel} open={open}>
    <NewPatientForm generateId={generateId} onCancel={onCancel} isBirth={isBirth} {...formProps} />
  </Modal>
));

export const NewPatientModal = connectApi((api, dispatch, { onCreateNewPatient }) => ({
  onSubmit: async data => {
    const newPatient = await api.post('patient', { ...data, registeredById: api.user.id });
    onCreateNewPatient(newPatient);
  },
}))(DumbNewPatientModal);
