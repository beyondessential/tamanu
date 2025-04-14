import React, { useCallback } from 'react';
import { useSuggester } from '../api';
import { useEncounter } from '../contexts/Encounter';
import { usePatientNavigation } from '../utils/usePatientNavigation';

import { ChangeDepartmentForm } from '../forms/ChangeDepartmentForm';
import { FormModal } from './FormModal';
import { TranslatedText } from './Translation/TranslatedText';

export const ChangeDepartmentModal = React.memo(({ open, onClose }) => {
  const { navigateToEncounter } = usePatientNavigation();
  const departmentSuggester = useSuggester('department', {
    baseQueryParameters: { filterByFacility: true },
  });
  const encounterCtx = useEncounter();
  const onSubmit = useCallback(
    async (data) => {
      const { encounter, writeAndViewEncounter } = encounterCtx;
      await writeAndViewEncounter(encounter.id, data);
      navigateToEncounter(encounter.id);
    },
    [encounterCtx, navigateToEncounter],
  );

  return (
    <FormModal
      title={
        <TranslatedText
          stringId="patient.encounter.action.changeDepartment"
          fallback="Change department"
          data-testid="translatedtext-3xnf"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="formmodal-foxm"
    >
      <ChangeDepartmentForm
        onSubmit={onSubmit}
        onCancel={onClose}
        departmentSuggester={departmentSuggester}
        data-testid="changedepartmentform-uznq"
      />
    </FormModal>
  );
});
