import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { viewPatient } from '../store/patient';
import { Modal } from './Modal';
import { DeathForm } from '../forms/DeathForm';
import { useApi, useSuggester } from '../api';

export const DeathModal = React.memo(({ open, onClose }) => {
  const api = useApi();
  const dispatch = useDispatch();
  const patient = useSelector(state => state.patient);
  const icd10Suggester = useSuggester('icd10');
  const practitionerSuggester = useSuggester('practitioner');
  const facilitySuggester = useSuggester('facility');

  const onSubmit = useCallback(
    () => async data => {
      const patientId = patient.id;
      await api.post(`patient/${patientId}/death`, data);

      onClose();
      dispatch(viewPatient(patientId));
    },
    [patient, api, dispatch, onClose],
  );

  return (
    <Modal title="Record patient death" open={open} onClose={onClose}>
      <DeathForm
        onSubmit={onSubmit}
        onCancel={onClose}
        patient={patient}
        icd10Suggester={icd10Suggester}
        practitionerSuggester={practitionerSuggester}
        facilitySuggester={facilitySuggester}
      />
    </Modal>
  );
});
