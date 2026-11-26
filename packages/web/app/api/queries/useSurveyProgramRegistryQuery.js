import { useQuery } from '@tanstack/react-query';
import { route } from '@tamanu/api-client';
import { useApi } from '../useApi';

export const useSurveyProgramRegistryQuery = (surveyId, patientId, { enabled = true } = {}) => {
  const api = useApi();
  return useQuery(
    ['surveyProgramRegistry', surveyId, patientId],
    () => api.get(route('survey/:surveyId/programRegistry', { surveyId }), { patientId }),
    { enabled: enabled && Boolean(surveyId) },
  );
};
