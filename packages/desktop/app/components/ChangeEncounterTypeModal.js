import React, { useCallback } from 'react';
import { push } from 'connected-react-router';
import { useEncounter } from '../contexts/Encounter';

import { Modal } from './Modal';

import { ChangeEncounterTypeForm } from '../forms/ChangeEncounterTypeForm';

export const ChangeEncounterTypeModal = React.memo(
  ({ open, encounter, onClose, onSubmit, ...rest }) => {
    const { writeAndViewEncounter } = useEncounter();
    const changeEncounterType = useCallback(
      async data => {
        await writeAndViewEncounter(encounter.id, data);
        onClose();
      },
      [encounter],
    );

    return (
      <Modal title="Change encounter type" open={open} onClose={onClose}>
        <ChangeEncounterTypeForm
          onSubmit={changeEncounterType}
          onCancel={onClose}
          encounter={encounter}
          {...rest}
        />
      </Modal>
    );
  },
);
