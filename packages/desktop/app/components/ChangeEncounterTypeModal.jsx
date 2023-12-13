import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import React, { useCallback } from 'react';
import { useEncounter } from '../contexts/Encounter';
import { ChangeEncounterTypeForm } from '../forms/ChangeEncounterTypeForm';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { FormModal } from './FormModal';

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
    <FormModal title="Change encounter type" open={open} onClose={onClose}>
      <ChangeEncounterTypeForm
        onSubmit={changeEncounterType}
        onCancel={onClose}
        encounter={encounter}
        initialNewType={newType}
      />
    </FormModal>
  );
});
