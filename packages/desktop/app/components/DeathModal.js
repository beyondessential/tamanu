import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';
import { reloadPatient } from '../store/patient';
import { Modal } from './Modal';
import { DeathForm } from '../forms/DeathForm';
import { useApi, useSuggester, isErrorUnknownAllow404s } from '../api';
import { usePatientNavigation } from '../utils/usePatientNavigation';

export const DeathModal = React.memo(({ open, onClose }) => {
  const api = useApi();
  const dispatch = useDispatch();
  const { navigateToPatient } = usePatientNavigation();
  const patient = useSelector(state => state.patient);
  const icd10Suggester = useSuggester('icd10');
  const practitionerSuggester = useSuggester('practitioner');
  const facilitySuggester = useSuggester('facility');
  const { data: deathData } = useQuery(['patientDeathSummary', patient.id], () =>
    api.get(`patient/${patient.id}/death`, {}, { isErrorUnknown: isErrorUnknownAllow404s }),
  );

  const recordPatientDeath = async data => {
    const patientId = patient.id;
    await api.post(`patient/${patientId}/death`, data);

    onClose();
    await dispatch(reloadPatient(patientId));
    navigateToPatient(patientId);
  };

  return (
    <Modal title="Record patient death" open={open} onClose={onClose}>
      <DeathForm
        onSubmit={recordPatientDeath}
        onCancel={onClose}
        patient={patient}
        deathData={deathData}
        icd10Suggester={icd10Suggester}
        practitionerSuggester={practitionerSuggester}
        facilitySuggester={facilitySuggester}
      />
    </Modal>
  );
});
