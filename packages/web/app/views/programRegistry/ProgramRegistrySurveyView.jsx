import React, { useState } from 'react';
import { SurveyView } from '../programs/SurveyView';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { usePatientProgramRegistrySurveys } from '../../api/queries/usePatientProgramRegistrySurveys';
import { useAuth } from '../../contexts/Auth';
import { usePatientAdditionalDataQuery, usePatientProgramRegistration } from '../../api/queries';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { useUrlSearchParams } from '../../utils/useUrlSearchParams';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { getAnswersFromData } from '../../utils';
import { useApi } from '../../api';

export const ProgramRegistrySurveyView = () => {
  const api = useApi();
  const [startTime] = useState(getCurrentDateTimeString());
  const queryParams = useUrlSearchParams();
  const { navigateToProgramRegistry } = usePatientNavigation();
  const title = queryParams.get('title');
  const { currentUser } = useAuth();
  const { patientId, programRegistryId, surveyId } = useParams();
  const patient = useSelector(state => state.patient);
  const { data: additionalData, isLoading: additionalDataLoading } = usePatientAdditionalDataQuery(
    patient.id,
  );

  const {
    data: patientProgramRegistration,
    isLoading: patientProgramRegistrationLoading,
  } = usePatientProgramRegistration(patient.id, programRegistryId);

  const { data: survey, isLoading, isError } = usePatientProgramRegistrySurveys(
    patientId,
    programRegistryId,
    surveyId,
  );

  const submitSurveyResponse = async data => {
    await api.post('surveyResponse', {
      surveyId: survey.id,
      startTime,
      patientId: patient.id,
      endTime: getCurrentDateTimeString(),
      answers: getAnswersFromData(data, survey),
    });

    navigateToProgramRegistry();
  };

  if (isLoading || additionalDataLoading || patientProgramRegistrationLoading)
    return <LoadingIndicator />;
  if (isError) return <p>{title || 'Unknown'}&apos; not found.</p>;

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
