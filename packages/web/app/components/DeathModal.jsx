import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { reloadPatient } from '../store/patient';
import { FormModal } from './FormModal';
import { DeathForm } from '../forms/DeathForm';
import { useApi, useSuggester } from '../api';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { TranslatedText } from './Translation/TranslatedText';

export const DeathModal = React.memo(({ open, onClose, deathData }) => {
  const api = useApi();
  const dispatch = useDispatch();
  const { navigateToPatient } = usePatientNavigation();
  const patient = useSelector(state => state.patient);
  const queryClient = useQueryClient();
  const diagnosisSuggester = useSuggester('diagnosis');
  const practitionerSuggester = useSuggester('practitioner');
  const facilitySuggester = useSuggester('facility');

  const recordPatientDeath = async data => {
    const patientId = patient.id;
    await api.post(`patient/${patientId}/death`, data);
    queryClient.invalidateQueries(['patientDeathSummary', patient.id]);

    onClose();
    await dispatch(reloadPatient(patientId));
    navigateToPatient(patientId);
  };

  return (
    <FormModal
      title={<TranslatedText
        stringId="death.modal.title"
        fallback="Record patient death"
        data-testid='translatedtext-anoc' />}
      open={open}
      onClose={onClose}
      data-testid='formmodal-301r'>
      <DeathForm
        onSubmit={recordPatientDeath}
        onCancel={onClose}
        patient={patient}
        deathData={deathData}
        diagnosisSuggester={diagnosisSuggester}
        practitionerSuggester={practitionerSuggester}
        facilitySuggester={facilitySuggester}
        data-testid='deathform-4faj' />
    </FormModal>
  );
});
