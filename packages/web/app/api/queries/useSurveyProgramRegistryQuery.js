import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useSurveyProgramRegistryQuery = (surveyId, patientId, { enabled = true } = {}) => {
  const api = useApi();
  return useQuery(
    ['surveyProgramRegistry', surveyId, patientId],
    () => api.get(`survey/${encodeURIComponent(surveyId)}/programRegistry`, { patientId }),
    { enabled: enabled && Boolean(surveyId) },
  );
};
