import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { reloadPatient } from '../store/patient';
import { FormModal } from './FormModal';
import { DeathForm } from '../forms/DeathForm';
import { useApi, useSuggester } from '../api';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { TranslatedText } from './Translation/TranslatedText';
import { useAuth } from '../contexts/Auth';

export const DeathModal = React.memo(({ open, onClose, deathData }) => {
  const api = useApi();
  const { facilityId } = useAuth();
  const dispatch = useDispatch();
  const { navigateToPatient } = usePatientNavigation();
  const patient = useSelector(state => state.patient);
  const queryClient = useQueryClient();
  const icd10Suggester = useSuggester('icd10');
  const practitionerSuggester = useSuggester('practitioner');
  const facilitySuggester = useSuggester('facility');

  const recordPatientDeath = async data => {
    const patientId = patient.id;
    await api.post(`patient/${patientId}/death`, data);
    queryClient.invalidateQueries(['patientDeathSummary', patient.id]);

    onClose();
    await dispatch(reloadPatient(patientId, facilityId));
    navigateToPatient(patientId);
  };

  return (
    <FormModal
      title={<TranslatedText stringId="death.modal.title" fallback="Record patient death" />}
      open={open}
      onClose={onClose}
    >
      <DeathForm
        onSubmit={recordPatientDeath}
        onCancel={onClose}
        patient={patient}
        deathData={deathData}
        icd10Suggester={icd10Suggester}
        practitionerSuggester={practitionerSuggester}
        facilitySuggester={facilitySuggester}
      />
    </FormModal>
  );
});
