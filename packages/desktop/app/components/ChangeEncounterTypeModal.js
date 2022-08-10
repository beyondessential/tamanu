import React, { useCallback } from 'react';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { useEncounter } from '../contexts/Encounter';

import { Modal } from './Modal';
import { ChangeEncounterTypeForm } from '../forms/ChangeEncounterTypeForm';

export const ChangeEncounterTypeModal = React.memo(({ open, encounter, onClose }) => {
  const { writeAndViewEncounter } = useEncounter();
  const { navigateToEncounter } = usePatientNavigation();
  const changeEncounterType = useCallback(
    async data => {
      await writeAndViewEncounter(encounter.id, data);
      navigateToEncounter(encounter.id);
      onClose();
    },
    [encounter, onClose, writeAndViewEncounter, navigateToEncounter],
  );

  return (
    <Modal title="Change encounter type" open={open} onClose={onClose}>
      <ChangeEncounterTypeForm
        onSubmit={changeEncounterType}
        onCancel={onClose}
        encounter={encounter}
      />
    </Modal>
  );
});
