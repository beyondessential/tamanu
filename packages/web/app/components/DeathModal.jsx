import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePatient } from '../contexts/Patient';
import { FormModal } from './FormModal';
import { DeathForm } from '../forms/DeathForm';
import { useApi, useSuggester } from '../api';
import { usePatientNavigation } from '../utils/usePatientNavigation';
import { invalidatePatientDataQueries } from '../utils';
import { TranslatedText } from './Translation/TranslatedText';

export const DeathModal = React.memo(({ open, onClose, deathData }) => {
  const api = useApi();
  const { navigateToPatient } = usePatientNavigation();
  const { patient } = usePatient();
  const queryClient = useQueryClient();
  const diagnosisSuggester = useSuggester('diagnosis');
  const practitionerSuggester = useSuggester('practitioner');
  const facilitySuggester = useSuggester('facility');

  const recordPatientDeath = async (data) => {
    const patientId = patient.id;
    await api.post(`patient/${patientId}/death`, data);
    // Recording death auto-discharges the active encounter, so refresh the current-encounter query
    // (and the rest of the patient data) alongside the death summary, not just patientDetails.
    await invalidatePatientDataQueries(queryClient, patientId);
    queryClient.invalidateQueries(['patientDeathSummary', patientId]);

    onClose();
    navigateToPatient(patientId);
  };

  if (!patient) return null;

  return (
    <FormModal
      title={
        <TranslatedText
          stringId="death.modal.title"
          fallback="Record patient death"
          data-testid="translatedtext-anoc"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="formmodal-301r"
    >
      <DeathForm
        onSubmit={recordPatientDeath}
        onCancel={onClose}
        patient={patient}
        deathData={deathData}
        diagnosisSuggester={diagnosisSuggester}
        practitionerSuggester={practitionerSuggester}
        facilitySuggester={facilitySuggester}
        data-testid="deathform-4faj"
      />
    </FormModal>
  );
});
