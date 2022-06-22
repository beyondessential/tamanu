import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { push } from 'connected-react-router';

import { Modal } from './Modal';
import { useSuggester } from '../api';
import { DischargeForm } from '../forms/DischargeForm';
import { useEncounter } from '../contexts/Encounter';
import { reloadPatient } from '../store/patient';

export const DischargeModal = React.memo(({ open, onClose }) => {
  const dispatch = useDispatch();
  const params = useParams();
  const patient = useSelector(state => state.patient);
  const { encounter, writeAndViewEncounter } = useEncounter();
  const practitionerSuggester = useSuggester('practitioner');

  const handleDischarge = useCallback(
    async data => {
      await writeAndViewEncounter(encounter.id, data);
      await dispatch(reloadPatient(patient.id));
      dispatch(push(`/patients/${params.category}/${patient.id}`));
      onClose();
    },
    [writeAndViewEncounter, encounter.id, dispatch, patient.id, onClose, params.category],
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
