import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import {
  type SurveyWithComponents,
  type PortalSurveyAssignment,
} from '@tamanu/shared/schemas/patientPortal';
import { route } from '@tamanu/api-client';

type SurveyResponse = SurveyWithComponents & {
  portalSurveyAssignment: PortalSurveyAssignment;
};

export const useSurveyQuery = (surveyId: string) => {
  const api = useApi();
  return useQuery<unknown, Error, SurveyResponse>({
    queryKey: ['survey', surveyId],
    queryFn: () => api.get(route('survey/:surveyId', { surveyId })),
    enabled: Boolean(surveyId),
  });
};
