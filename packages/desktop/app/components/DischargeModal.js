import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Modal } from './Modal';
import { useSuggester } from '../api';
import { DischargeForm } from '../forms/DischargeForm';
import { useEncounter } from '../contexts/Encounter';
import { viewPatient } from '../store';

export const DischargeModal = React.memo(({ open, onClose }) => {
  const dispatch = useDispatch();
  const patient = useSelector(state => state.patient);
  const { encounter, writeAndViewEncounter } = useEncounter();
  const practitionerSuggester = useSuggester('practitioner');

  const handleDischarge = useCallback(
    async data => {
      await writeAndViewEncounter(encounter.id, data);
      await dispatch(viewPatient(patient.id));
      onClose();
    },
    [writeAndViewEncounter, encounter.id, dispatch, patient.id, onClose],
  );

  return (
    <Modal title="Discharge" open={open} onClose={onClose}>
      <DischargeForm
        onSubmit={handleDischarge}
        onCancel={onClose}
        encounter={encounter}
        practitionerSuggester={practitionerSuggester}
      />
    </Modal>
  );
});
