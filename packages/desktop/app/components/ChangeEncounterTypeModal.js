import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useEncounter } from '../contexts/Encounter';

import { Modal } from './Modal';

import { ChangeEncounterTypeForm } from '../forms/ChangeEncounterTypeForm';

export const ChangeEncounterTypeModal = React.memo(({ open, encounter, onClose, extraRoute }) => {
  const params = useParams();
  const { writeAndViewEncounter } = useEncounter();
  const changeEncounterType = useCallback(
    async data => {
      await writeAndViewEncounter(params.patientId, encounter.id, data, params.category);
      onClose();
    },
    [encounter, onClose, writeAndViewEncounter, params.category, params.patientId],
  );

  return (
    <Modal title="Change encounter type" open={open} onClose={onClose}>
      <ChangeEncounterTypeForm
        onSubmit={changeEncounterType}
        onCancel={onClose}
        encounter={encounter}
        extraRoute={extraRoute}
      />
    </Modal>
  );
});
