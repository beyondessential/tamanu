import React, { useState } from 'react';
import { SurveyView } from '../programs/SurveyView';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { usePatientProgramRegistrySurveysQuery } from '../../api/queries/usePatientProgramRegistrySurveysQuery';
import { useAuth } from '../../contexts/Auth';
import {
  usePatientAdditionalDataQuery,
  usePatientProgramRegistrationQuery,
} from '../../api/queries';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { getAnswersFromData } from '../../utils';
import { useApi } from '../../api';
import { TranslatedText } from '../../components/index.js';

export const ProgramRegistrySurveyView = () => {
  const api = useApi();
  const [startTime] = useState(getCurrentDateTimeString());
  const { navigateToProgramRegistry } = usePatientNavigation();
  const { currentUser, facilityId } = useAuth();
  const { patientId, programRegistryId, surveyId } = useParams();
  const patient = useSelector(state => state.patient);
  const { data: additionalData, isLoading: additionalDataLoading } = usePatientAdditionalDataQuery(
    patient.id,
  );

  const {
    data: patientProgramRegistration,
    isLoading: patientProgramRegistrationLoading,
  } = usePatientProgramRegistrationQuery(patient.id, programRegistryId);

  const { data: survey, isLoading, isError } = usePatientProgramRegistrySurveysQuery(
    patientId,
    programRegistryId,
    surveyId,
  );

  const submitSurveyResponse = async data => {
    await api.post('surveyResponse', {
      surveyId: survey.id,
      startTime,
      patientId: patient.id,
      facilityId,
      endTime: getCurrentDateTimeString(),
      answers: getAnswersFromData(data, survey),
    });

    navigateToProgramRegistry();
  };

  if (isLoading || additionalDataLoading || patientProgramRegistrationLoading) {
    return <LoadingIndicator />;
  }

  if (isError) {
    return (
      <p data-testid='p-pmgd'>
        <TranslatedText
          stringId="programRegistry.registryNotFoundMessage"
          fallback="Program registry not found."
          data-testid='translatedtext-v6ov' />
      </p>
    );
  }

  return (
    <SurveyView
      onSubmit={submitSurveyResponse}
      survey={survey}
      onCancel={() => {
        navigateToProgramRegistry();
      }}
      patient={patient}
      patientAdditionalData={additionalData}
      patientProgramRegistration={patientProgramRegistration}
      currentUser={currentUser}
    />
  );
};
