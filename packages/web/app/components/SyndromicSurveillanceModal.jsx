import React, { useState } from 'react';
import styled from 'styled-components';
import { useQueryClient } from '@tanstack/react-query';

import { SYNDROMIC_SURVEILLANCE_SURVEY_ID } from '@tamanu/constants';
import {
  usePatientAdditionalDataQuery,
  useSurveyQuery,
  useSurveyResponseQuery,
} from '../api/queries';
import { useAuth } from '../contexts/Auth';
import { useSubmitSyndromicSurveillance } from '../hooks/useSubmitSyndromicSurveillance';
import { EmbeddedSurveyBox } from './EmbeddedSurveyBox';
import { ErrorMessage } from './ErrorMessage';
import { SurveyViewForm } from '../views/programs/SurveyView';
import { useSurveyResponseEditMutation } from '../views/programs/useSurveyResponseEditMutation';
import { useSurveyResponseEditValues } from '../views/programs/useSurveyResponseEditValues';
import { FormModal } from './FormModal';
import { LoadingIndicator } from './LoadingIndicator';
import { SurveyResponseChangelogModal } from './SurveyResponseChangelogModal';
import { TranslatedReferenceData } from './Translation';
import { TranslatedText } from './Translation/TranslatedText';

// A subtitle beneath the modal's title, as the form is embedded in the modal.
const FormCompleteHeading = styled.h3`
  margin-block: 0 8px;
  font-size: 16px;
  font-weight: 500;
  line-height: 21px;
`;

const FORM_COMPLETE_HEADING = (
  <FormCompleteHeading data-testid="formcompleteheading-syndromic-surveillance">
    <TranslatedText
      stringId="paginatedForm.summary.heading"
      fallback="Form complete"
      data-testid="translatedtext-syndromic-surveillance-form-complete"
    />
  </FormCompleteHeading>
);

const SubmitSyndromicSurveillanceForm = ({ encounterId, patient, onClose }) => {
  const { currentUser } = useAuth();
  const { data: survey, error: surveyError } = useSurveyQuery(SYNDROMIC_SURVEILLANCE_SURVEY_ID);
  const { data: patientAdditionalData, isLoading: isLoadingPatientAdditionalData } =
    usePatientAdditionalDataQuery(patient.id);
  const submitSyndromicSurveillance = useSubmitSyndromicSurveillance({
    encounterId,
    patientId: patient.id,
  });

  const submitSurveyResponse = async formValues => {
    await submitSyndromicSurveillance(survey, formValues);
    onClose();
  };

  if (surveyError) {
    return (
      <ErrorMessage
        title={
          <TranslatedText
            stringId="program.modal.selectSurvey.error.title"
            fallback="Couldn’t load form"
          />
        }
        error={surveyError}
      />
    );
  }

  if (!survey || isLoadingPatientAdditionalData) {
    return <LoadingIndicator data-testid="loadingindicator-syndromic-surveillance-form" />;
  }

  return (
    <SurveyViewForm
      survey={survey}
      onSubmit={submitSurveyResponse}
      onCancel={onClose}
      showCancelButton
      showButtonRowDivider={false}
      showSummaryCancelButton
      summaryHeading={FORM_COMPLETE_HEADING}
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
  const { data: surveyResponse, error: surveyResponseError } =
    useSurveyResponseQuery(surveyResponseId);
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

  if (surveyResponseError) {
    return (
      <ErrorMessage
        title={
          <TranslatedText
            stringId="program.modal.surveyResponse.error.title"
            fallback="Couldn’t load form response :id"
            replacements={{ id: surveyResponseId }}
          />
        }
        error={surveyResponseError}
      />
    );
  }

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
        showButtonRowDivider={false}
        showSummaryCancelButton
        summaryHeading={FORM_COMPLETE_HEADING}
        patient={patient}
        patientAdditionalData={patientAdditionalData}
        currentUser={currentUser}
        initialAnswerOverrides={initialAnswerOverrides}
        editedDataElementIds={editedDataElementIds}
        onViewChangeLog={() => setIsChangelogOpen(true)}
        editedSurveyResponseId={surveyResponseId}
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

// Titled with the form's name, which each deployment configures. Mounted only while the modal is
// open, and shares its request with the form being completed.
const SyndromicSurveillanceModalTitle = () => {
  const { data: survey } = useSurveyQuery(SYNDROMIC_SURVEILLANCE_SURVEY_ID);
  if (!survey) return null;
  return (
    <TranslatedReferenceData
      category="survey"
      value={survey.id}
      fallback={survey.name}
      data-testid="translatedreferencedata-syndromic-surveillance-title"
    />
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
    title={<SyndromicSurveillanceModalTitle />}
    open={open}
    onClose={onClose}
    data-testid="formmodal-syndromic-surveillance"
  >
    <EmbeddedSurveyBox data-testid="embeddedsurveybox-syndromic-surveillance">
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
    </EmbeddedSurveyBox>
  </FormModal>
);
