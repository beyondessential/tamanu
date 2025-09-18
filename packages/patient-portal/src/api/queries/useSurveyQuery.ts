import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { type SurveyWithComponents } from '@tamanu/shared/schemas/patientPortal';

export const useSurveyQuery = (surveyId: string) => {
  const api = useApi();
  return useQuery<unknown, Error, SurveyWithComponents>({
    queryKey: ['survey', surveyId],
    queryFn: () => api.get(`survey/${surveyId}`),
    enabled: Boolean(surveyId),
  });
};
