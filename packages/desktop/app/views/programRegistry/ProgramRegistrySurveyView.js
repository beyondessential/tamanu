import React from 'react';
import { SurveyView } from 'desktop/app/views/programs/SurveyView';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { usePatientProgramRegistrySurveys } from '../../api/queries/usePatientProgramRegistrySurveys';
import { useUrlQueryParams } from '../../hooks';
import { useAuth } from '../../contexts/Auth';
import { usePatientAdditionalDataQuery, usePatientProgramRegistration } from '../../api/queries';
import { LoadingIndicator } from '../../components/LoadingIndicator';

export const ProgramRegistrySurveyView = () => {
  const queryParams = useUrlQueryParams();
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

  if (isLoading || additionalDataLoading || patientProgramRegistrationLoading)
    return <LoadingIndicator />;
  if (isError) return <p>{title || 'Unknown'}&apos; not found.</p>;

  return (
    <SurveyView
      onSubmit={() => {}}
      survey={survey}
      onCancel={() => {}}
      patient={patient}
      patientAdditionalData={additionalData}
      patientProgramRegistration={patientProgramRegistration}
      currentUser={currentUser}
    />
  );
};
