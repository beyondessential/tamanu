import React, { useCallback } from 'react';
import { push } from 'connected-react-router';

import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';

import { VitalsForm } from '../forms/VitalsForm';
import { useEncounter } from '../contexts/Encounter';

const DumbVitalsModal = React.memo(({ onClose, onSubmit }) => {
  const { fetchData, encounter } = useEncounter();

  const recordVitals = useCallback(data => {
    onSubmit(data, encounter.id);
    fetchData();
  }, []);

  return (
    <Modal title="Record vitals" open onClose={onClose}>
      <VitalsForm form={VitalsForm} onSubmit={recordVitals} onCancel={onClose} />
    </Modal>
  );
});

export const VitalsModal = connectApi((api, dispatch, { onClose }) => ({
  onSubmit: async (data, encounterId) => {
    await api.post(`vitals`, {
      ...data,
      encounterId,
    });
    dispatch(push(`/patients/encounter/`));
    onClose();
  },
}))(DumbVitalsModal);
