import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import {
  FullSurveySchema,
  type FullSurvey,
} from '@tamanu/shared/schemas/patientPortal/responses/survey.schema';

export const useSurveyQuery = (designationId: string) => {
  const api = useApi();
  return useQuery<unknown, Error, FullSurvey>({
    queryKey: ['survey', designationId],
    queryFn: () => api.get(`/me/forms/${designationId}`),
    select: data => FullSurveySchema.parse(data),
    enabled: Boolean(designationId),
  });
};
