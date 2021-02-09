import React, { useCallback } from 'react';

import { connectApi } from '../api/connectApi';

import { VitalsForm } from '../forms/VitalsForm';
import { useEncounter } from '../contexts/Encounter';

import { Modal } from './Modal';

const DumbVitalsModal = React.memo(({ onClose, onSubmit }) => {
  const { loadEncounter, encounter } = useEncounter();

  const recordVitals = useCallback(
    async data => {
      await onSubmit(data, encounter.id);
      await loadEncounter(encounter.id);
      onClose();
    },
    [encounter],
  );

  return (
    <Modal title="Record vitals" open onClose={onClose}>
      <VitalsForm form={VitalsForm} onSubmit={recordVitals} onCancel={onClose} />
    </Modal>
  );
});

export const VitalsModal = connectApi(api => ({
  onSubmit: async (data, encounterId) => {
    await api.post(`vitals`, {
      ...data,
      encounterId,
    });
  },
}))(DumbVitalsModal);
