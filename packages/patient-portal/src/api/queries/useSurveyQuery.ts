import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import {
  type SurveyWithComponents,
} from '@tamanu/shared/schemas/patientPortal/responses/survey.schema';

export const useSurveyQuery = (assignmentId: string) => {
  const api = useApi();
  return useQuery<unknown, Error, SurveyWithComponents>({
    queryKey: ['survey', assignmentId],
    queryFn: () => api.get(`/me/surveys/${assignmentId}`),
    enabled: Boolean(assignmentId),
  });
};
