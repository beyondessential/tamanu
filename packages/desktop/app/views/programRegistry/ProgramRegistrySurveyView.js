import React from 'react';
import { SurveyView } from 'desktop/app/views/programs/SurveyView';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { usePatientProgramRegistrySurveys } from '../../api/queries/usePatientProgramRegistrySurveys';
import { useAuth } from '../../contexts/Auth';
import { usePatientAdditionalDataQuery, usePatientProgramRegistration } from '../../api/queries';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import { ProgramRegistryProvider } from '../../contexts/ProgramRegistry';
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
    <ProgramRegistryProvider value={{ programRegistryId: 'programRegistryId' }}>
      <SurveyView
        onSubmit={() => {}}
        survey={survey}
        onCancel={() => {}}
        patient={patient}
        patientAdditionalData={additionalData}
        patientProgramRegistration={patientProgramRegistration}
        currentUser={currentUser}
      />
    </ProgramRegistryProvider>
  );
};
