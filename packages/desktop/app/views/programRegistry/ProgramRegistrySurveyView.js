import React from 'react';
import { SurveyView } from 'desktop/app/views/programs/SurveyView';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { usePatientProgramRegistrySurveys } from '../../api/queries/usePatientProgramRegistrySurveys';
import { useAuth } from '../../contexts/Auth';
import { usePatientAdditionalDataQuery } from '../../api/queries';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { useUrlSearchParams } from '../../utils/useUrlSearchParams';

export const ProgramRegistrySurveyView = () => {
  const queryParams = useUrlSearchParams();
  const title = queryParams.get('title');
  const { currentUser } = useAuth();
  const { patientId, programRegistryId, surveyId } = useParams();
  const patient = useSelector(state => state.patient);
  const { data: additionalData, isLoading: additionalDataLoading } = usePatientAdditionalDataQuery(
    patient.id,
  );
  const { data: survey, isLoading, isError } = usePatientProgramRegistrySurveys(
    patientId,
    programRegistryId,
    surveyId,
  );

  if (isLoading || additionalDataLoading) return <LoadingIndicator />;
  if (isError) return <p>{title || 'Unknown'}&apos; not found.</p>;

  return (
    <SurveyView
      onSubmit={() => {
        // console.log('onSubmit ', param);
      }}
      survey={survey}
      onCancel={() => {
        // console.log('onCancel ', param);
      }}
      patient={patient}
      patientAdditionalData={additionalData}
      currentUser={currentUser}
    />
  );
};
