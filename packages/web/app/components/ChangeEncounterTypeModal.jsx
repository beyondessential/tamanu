import React, { useCallback } from 'react';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { useEncounter } from '../contexts/Encounter';
import { useDateTimeFormat } from '@tamanu/ui-components';
import { FormModal } from './FormModal';
import { ChangeEncounterTypeForm } from '../forms/ChangeEncounterTypeForm';

export const ChangeEncounterTypeModal = React.memo(({ open, encounter, onClose, newType }) => {
  const { writeAndViewEncounter } = useEncounter();
  const { navigateToEncounter } = usePatientNavigation();
  const { getCountryCurrentDateTimeString } = useDateTimeFormat();
  const changeEncounterType = useCallback(
    async data => {
      await writeAndViewEncounter(encounter.id, {
        ...data,
        submittedTime: getCountryCurrentDateTimeString(),
      });
      navigateToEncounter(encounter.id);
      onClose();
    },
    [
      encounter,
      onClose,
      writeAndViewEncounter,
      navigateToEncounter,
      getCountryCurrentDateTimeString,
    ],
  );

  return (
    <FormModal
      title="Change encounter type"
      open={open}
      onClose={onClose}
      data-testid="formmodal-k6jr"
    >
      <ChangeEncounterTypeForm
        onSubmit={changeEncounterType}
        onCancel={onClose}
        encounter={encounter}
        initialNewType={newType}
        data-testid="changeencountertypeform-b0cj"
      />
    </FormModal>
  );
});
