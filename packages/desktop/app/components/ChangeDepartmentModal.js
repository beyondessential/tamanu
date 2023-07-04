import React, { useCallback } from 'react';
import { useSuggester } from '../api';
import { useEncounter } from '../contexts/Encounter';
import { usePatientNavigation } from '../utils/usePatientNavigation';

import { ChangeDepartmentForm } from '../forms/ChangeDepartmentForm';
import { Modal } from './Modal';

export const ChangeDepartmentModal = React.memo(({ open, onClose }) => {
  const { navigateToEncounter } = usePatientNavigation();
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });
  const encounterCtx = useEncounter();
  const onSubmit = useCallback(
    async data => {
      const { encounter, writeAndViewEncounter } = encounterCtx;
      await writeAndViewEncounter(encounter.id, data);
      navigateToEncounter(encounter.id);
    },
    [encounterCtx, navigateToEncounter],
  );

  return (
    <Modal title="Change department" open={open} onClose={onClose}>
      <ChangeDepartmentForm
        onSubmit={onSubmit}
        onCancel={onClose}
        departmentSuggester={departmentSuggester}
      />
    </Modal>
  );
});
