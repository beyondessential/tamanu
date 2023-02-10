import React, { useCallback } from 'react';
import { usePatientNavigation } from '../utils/usePatientNavigation';

import { Modal } from './Modal';
import { useSuggester } from '../api';
import { DischargeForm } from '../forms/DischargeForm';
import { useEncounter } from '../contexts/Encounter';
import { usePatient } from '../contexts/Patient';

export const DischargeModal = React.memo(({ open, onClose }) => {
  const { navigateToPatient } = usePatientNavigation();
  const { patient, loadPatient } = usePatient();
  const { encounter, writeAndViewEncounter } = useEncounter();
  const practitionerSuggester = useSuggester('practitioner');
  const dispositionSuggester = useSuggester('dischargeDisposition');

  const handleDischarge = useCallback(
    async data => {
      await writeAndViewEncounter(encounter.id, data);
      await loadPatient(patient.id);
      navigateToPatient(patient.id);
      onClose();
    },
    [writeAndViewEncounter, encounter.id, dispatch, patient.id, onClose, navigateToPatient],
  );

  return (
    <Modal title="Discharge" open={open} onClose={onClose}>
      <DischargeForm
        onSubmit={handleDischarge}
        onCancel={onClose}
        encounter={encounter}
        practitionerSuggester={practitionerSuggester}
        dispositionSuggester={dispositionSuggester}
      />
    </Modal>
  );
});
