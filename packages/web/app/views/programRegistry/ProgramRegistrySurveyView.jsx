import React, { useState } from 'react';
import { SurveyView } from '../programs/SurveyView';
import { useParams } from 'react-router';
import { useSelector } from 'react-redux';
import { getAnswersFromData, useDateTimeFormat } from '@tamanu/ui-components';
import { usePatientProgramRegistrySurveysQuery } from '../../api/queries/usePatientProgramRegistrySurveysQuery';
import { useAuth } from '../../contexts/Auth';
import {
  usePatientAdditionalDataQuery,
  usePatientProgramRegistrationQuery,
} from '../../api/queries';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { usePatientNavigation } from '../../utils/usePatientNavigation';
import { useApi } from '../../api';
import { TranslatedText } from '../../components/index.js';

export const ProgramRegistrySurveyView = () => {
  const api = useApi();
  const { getCountryCurrentDateTimeString } = useDateTimeFormat();
  const [startTime] = useState(getCountryCurrentDateTimeString());
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
      endTime: getCountryCurrentDateTimeString(),
      answers: await getAnswersFromData(data, survey),
    });

    navigateToProgramRegistry();
  };

  if (isLoading || additionalDataLoading || patientProgramRegistrationLoading) {
    return <LoadingIndicator data-testid="loadingindicator-z681" />;
  }

  if (isError) {
    return (
      <p>
        <TranslatedText
          stringId="programRegistry.registryNotFoundMessage"
          fallback="Program registry not found."
          data-testid="translatedtext-pkuz"
        />
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
      data-testid="surveyview-kuhc"
    />
  );
};
