import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { push } from 'connected-react-router';
import { useEncounter } from '../contexts/Encounter';

import { Modal } from './Modal';
import { ChangeEncounterTypeForm } from '../forms/ChangeEncounterTypeForm';

export const ChangeEncounterTypeModal = React.memo(({ open, encounter, onClose, extraRoute }) => {
  const params = useParams();
  const dispatch = useDispatch();
  const { writeAndViewEncounter } = useEncounter();
  const changeEncounterType = useCallback(
    async data => {
      await writeAndViewEncounter(encounter.id, data);
      dispatch(push(`/patients/${params.category}/${params.patientId}/encounter/${encounter.id}/`));
      onClose();
    },
    [encounter, onClose, writeAndViewEncounter, params.category, params.patientId, dispatch],
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
