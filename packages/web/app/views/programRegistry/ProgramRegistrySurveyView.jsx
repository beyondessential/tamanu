import React, { useState } from 'react';
import { SurveyView } from '../programs/SurveyView';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { usePatientProgramRegistrySurveysQuery } from '../../api/queries/usePatientProgramRegistrySurveysQuery';
import { useAuth } from '../../contexts/Auth';
import { usePatientAdditionalDataQuery, usePatientProgramRegistrationQuery } from '../../api/queries';
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
