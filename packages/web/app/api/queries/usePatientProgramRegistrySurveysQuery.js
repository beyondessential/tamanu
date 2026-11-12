import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const usePatientProgramRegistrySurveysQuery = (
  patientId,
  programRegistryId,
  surveyId,
  fetchOptions,
) => {
  const api = useApi();
  return useQuery(['PatientProgramRegistrySurveys', programRegistryId, surveyId], () =>
    api.get(route('survey/:surveyId', { surveyId }), fetchOptions),
  );
};
