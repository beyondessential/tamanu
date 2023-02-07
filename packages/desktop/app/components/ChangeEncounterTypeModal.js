import React, { useCallback } from 'react';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { useEncounter } from '../contexts/Encounter';
import { Modal } from './Modal';
import { ChangeEncounterTypeForm } from '../forms/ChangeEncounterTypeForm';

export const ChangeEncounterTypeModal = React.memo(({ open, encounter, onClose, newType }) => {
  const { writeAndViewEncounter } = useEncounter();
  const { navigateToEncounter } = usePatientNavigation();
  const changeEncounterType = useCallback(
    async data => {
      await writeAndViewEncounter(encounter.id, {
        ...data,
        submittedTime: getCurrentDateTimeString(),
      });
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
        initialNewType={newType}
      />
    </Modal>
  );
});
