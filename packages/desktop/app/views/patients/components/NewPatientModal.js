import React, { useCallback } from 'react';
import { generateId } from '@tamanu/shared/utils/generateId';

import { Modal } from '../../../components';
import { NewPatientForm } from '../../../forms';
import { useApi } from '../../../api';
import { notifyError } from '../../../utils';
import { TranslatedText } from '../../../components/Translation/TranslatedText';

export const NewPatientModal = ({ open, onCancel, onCreateNewPatient, ...formProps }) => {
  const api = useApi();
  const onSubmit = useCallback(
    async data => {
      try {
        const newPatient = await api.post('patient', { ...data, registeredById: api.user.id });
        onCreateNewPatient(newPatient);
      } catch (e) {
        notifyError(e.message);
      }
    },
    [api, onCreateNewPatient],
  );
  return (
    <Modal
      title={<TranslatedText stringId="patient.modal.create.title" fallback="Add new patient" />}
      onClose={onCancel}
      open={open}
    >
      <NewPatientForm
        generateId={generateId}
        onCancel={onCancel}
        onSubmit={onSubmit}
        {...formProps}
      />
    </Modal>
  );
};
