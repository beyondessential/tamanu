import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import {
  FullSurveySchema,
  type FullSurvey,
} from '@tamanu/shared/schemas/patientPortal/responses/survey.schema';

export const useAssignedSurveyQuery = (assignmentId: string) => {
  const api = useApi();
  return useQuery<unknown, Error, FullSurvey>({
    queryKey: ['survey', assignmentId],
    queryFn: () => api.get(`/me/surveys/${assignmentId}`),
    select: data => FullSurveySchema.parse(data),
    enabled: Boolean(assignmentId),
  });
};
