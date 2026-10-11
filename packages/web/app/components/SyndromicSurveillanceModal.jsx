import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { SYNDROMIC_SURVEILLANCE_SURVEY_ID } from '@tamanu/constants';
import { getAnswersFromData, useDateTime } from '@tamanu/ui-components';
import { useApi } from '../api';
import {
  usePatientAdditionalDataQuery,
  useSurveyQuery,
  useSurveyResponseQuery,
} from '../api/queries';
import { ENCOUNTER_SYNDROMIC_SURVEILLANCE_QUERY_KEY } from '../api/queries/useEncounterSyndromicSurveillanceQuery';
import { useAuth } from '../contexts/Auth';
import { SurveyViewForm } from '../views/programs/SurveyView';
import { useSurveyResponseEditMutation } from '../views/programs/useSurveyResponseEditMutation';
import { useSurveyResponseEditValues } from '../views/programs/useSurveyResponseEditValues';
import { FormModal } from './FormModal';
import { LoadingIndicator } from './LoadingIndicator';
import { SurveyResponseChangelogModal } from './SurveyResponseChangelogModal';
import { TranslatedText } from './Translation/TranslatedText';

const SubmitSyndromicSurveillanceForm = ({ encounterId, patient, onClose }) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { currentUser, facilityId } = useAuth();
  const { getCurrentDateTime } = useDateTime();
  const [startTime] = useState(getCurrentDateTime);
  const { data: survey } = useSurveyQuery(SYNDROMIC_SURVEILLANCE_SURVEY_ID);
  const { data: patientAdditionalData, isLoading: isLoadingPatientAdditionalData } =
    usePatientAdditionalDataQuery(patient.id);

  const submitSurveyResponse = async data => {
    try {
      await api.post(
        `encounter/${encodeURIComponent(encounterId)}/syndromicSurveillance/surveyResponse`,
        {
          facilityId,
          startTime,
          endTime: getCurrentDateTime(),
          answers: await getAnswersFromData(data, survey),
        },
      );
      queryClient.invalidateQueries(['patientDetails', patient.id]);
      onClose();
    } finally {
      // Refreshed on failure too: a submission is rejected once the encounter has a response, such
      // as one a colleague has just submitted, and the pane then shows it as complete.
      queryClient.invalidateQueries([ENCOUNTER_SYNDROMIC_SURVEILLANCE_QUERY_KEY, encounterId]);
    }
  };

  if (!survey || isLoadingPatientAdditionalData) {
    return <LoadingIndicator data-testid="loadingindicator-syndromic-surveillance-form" />;
  }

  return (
    <SurveyViewForm
      survey={survey}
      onSubmit={submitSurveyResponse}
      onCancel={onClose}
      showCancelButton
      patient={patient}
      patientAdditionalData={patientAdditionalData}
      currentUser={currentUser}
    />
  );
};

const EditSyndromicSurveillanceForm = ({ surveyResponseId, patient, onClose }) => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const { data: surveyResponse } = useSurveyResponseQuery(surveyResponseId);
  const { data: patientAdditionalData, isLoading: isLoadingPatientAdditionalData } =
    usePatientAdditionalDataQuery(patient.id);
  const { surveyForEdit, initialAnswerOverrides, editedDataElementIds } =
    useSurveyResponseEditValues(surveyResponse);

  const { mutateAsync: submitSurveyResponseEdit } = useSurveyResponseEditMutation(
    { surveyResponseId, survey: surveyForEdit },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['patientDetails', patient.id]);
        queryClient.invalidateQueries(['surveyResponseAnswer', 'latest-answer', patient.id]);
        onClose();
      },
    },
  );

  if (!surveyForEdit || isLoadingPatientAdditionalData) {
    return <LoadingIndicator data-testid="loadingindicator-syndromic-surveillance-edit" />;
  }

  return (
    <>
      <SurveyViewForm
        survey={surveyForEdit}
        onSubmit={submitSurveyResponseEdit}
        onCancel={onClose}
        showCancelButton
        patient={patient}
        patientAdditionalData={patientAdditionalData}
        currentUser={currentUser}
        initialAnswerOverrides={initialAnswerOverrides}
        editedDataElementIds={editedDataElementIds}
        onViewChangeLog={() => setIsChangelogOpen(true)}
      />
      <SurveyResponseChangelogModal
        open={isChangelogOpen}
        surveyResponseId={surveyResponseId}
        surveyName={surveyResponse?.surveyName}
        onClose={() => setIsChangelogOpen(false)}
        data-testid="surveyresponsechangelogmodal-syndromic-surveillance"
      />
    </>
  );
};

/**
 * Completes the encounter's syndromic surveillance form, or edits its existing response when one is
 * given.
 *
 * spec: SYND#diagnosis-pane
 */
export const SyndromicSurveillanceModal = ({
  open,
  onClose,
  encounterId,
  patient,
  surveyResponseId = null,
}) => (
  <FormModal
    width="md"
    title={
      <TranslatedText
        stringId="syndromicSurveillance.modal.title"
        fallback="Syndromic surveillance"
        data-testid="translatedtext-syndromic-surveillance-title"
      />
    }
    open={open}
    onClose={onClose}
    data-testid="formmodal-syndromic-surveillance"
  >
    {surveyResponseId ? (
      <EditSyndromicSurveillanceForm
        surveyResponseId={surveyResponseId}
        patient={patient}
        onClose={onClose}
      />
    ) : (
      <SubmitSyndromicSurveillanceForm
        encounterId={encounterId}
        patient={patient}
        onClose={onClose}
      />
    )}
  </FormModal>
);
