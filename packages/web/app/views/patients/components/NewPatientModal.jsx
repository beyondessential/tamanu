import React, { useCallback } from 'react';

import { generateId } from '@tamanu/utils/generateId';

import { FormModal } from '../../../components';
import { NewPatientForm } from '../../../forms';
import { useApi } from '../../../api';
import { notifyError } from '../../../utils';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { useAuth } from '../../../contexts/Auth';

export const NewPatientModal = ({ open, onCancel, onCreateNewPatient, ...formProps }) => {
  const api = useApi();
  const { facilityId } = useAuth();
  const onSubmit = useCallback(
    async data => {
      try {
        const newPatient = await api.post('patient', {
          ...data,
          registeredById: api.user.id,
          facilityId,
        });
        onCreateNewPatient(newPatient);
      } catch (e) {
        notifyError(e.message);
      }
    },
    [api, onCreateNewPatient, facilityId],
  );
  return (
    <FormModal
      title={<TranslatedText
        stringId="patient.modal.create.title"
        fallback="Add new patient"
        data-test-id='translatedtext-0s97' />}
      onClose={onCancel}
      open={open}
    >
      <NewPatientForm
        generateId={generateId}
        onCancel={onCancel}
        onSubmit={onSubmit}
        {...formProps}
      />
    </FormModal>
  );
};
