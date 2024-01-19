import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePatientNavigation } from '../utils/usePatientNavigation';

import { FormModal } from './FormModal';
import { useSuggester } from '../api';
import { DischargeForm } from '../forms/DischargeForm';
import { useEncounter } from '../contexts/Encounter';
import { reloadPatient } from '../store/patient';

export const DischargeModal = React.memo(({ open, onClose }) => {
  const dispatch = useDispatch();
  const { navigateToPatient } = usePatientNavigation();
  const patient = useSelector(state => state.patient);
  const { encounter, writeAndViewEncounter } = useEncounter();
  const practitionerSuggester = useSuggester('practitioner');
  const dispositionSuggester = useSuggester('dischargeDisposition');

  const handleDischarge = useCallback(
    async data => {
      await writeAndViewEncounter(encounter.id, data);
      await dispatch(reloadPatient(patient.id));
      navigateToPatient(patient.id);
      onClose();
    },
    [writeAndViewEncounter, encounter.id, dispatch, patient.id, onClose, navigateToPatient],
  );

  return (
    <FormModal title="Discharge patient" open={open} onClose={onClose}>
      <DischargeForm
        onSubmit={handleDischarge}
        onCancel={onClose}
        encounter={encounter}
        practitionerSuggester={practitionerSuggester}
        dispositionSuggester={dispositionSuggester}
      />
    </FormModal>
  );
});
