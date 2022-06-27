import React from 'react';
import { useParams } from 'react-router-dom';
import { push } from 'connected-react-router';
import { useDispatch, useSelector } from 'react-redux';
import { reloadPatient } from '../store/patient';
import { Modal } from './Modal';
import { DeathForm } from '../forms/DeathForm';
import { useApi, useSuggester } from '../api';

export const DeathModal = React.memo(({ open, onClose }) => {
  const api = useApi();
  const params = useParams();
  const dispatch = useDispatch();
  const patient = useSelector(state => state.patient);
  const icd10Suggester = useSuggester('icd10');
  const practitionerSuggester = useSuggester('practitioner');
  const facilitySuggester = useSuggester('facility');

  const recordPatientDeath = async data => {
    const patientId = patient.id;
    await api.post(`patient/${patientId}/death`, data);

    onClose();
    await dispatch(reloadPatient(patientId));
    dispatch(push(`/patients/${params.category}/${patientId}`));
  };

  return (
    <Modal title="Record patient death" open={open} onClose={onClose}>
      <DeathForm
        onSubmit={recordPatientDeath}
        onCancel={onClose}
        patient={patient}
        icd10Suggester={icd10Suggester}
        practitionerSuggester={practitionerSuggester}
        facilitySuggester={facilitySuggester}
      />
    </Modal>
  );
});
