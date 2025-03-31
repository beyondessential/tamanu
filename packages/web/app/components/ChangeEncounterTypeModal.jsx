import React, { useCallback } from 'react';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { useEncounter } from '../contexts/Encounter';
import { FormModal } from './FormModal';
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
    <FormModal
      title="Change encounter type"
      open={open}
      onClose={onClose}
      data-testid='formmodal-k6jr'>
      <ChangeEncounterTypeForm
        onSubmit={changeEncounterType}
        onCancel={onClose}
        encounter={encounter}
        initialNewType={newType}
        data-testid='changeencountertypeform-b0cj' />
    </FormModal>
  );
});
