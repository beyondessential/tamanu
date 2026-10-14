import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import {
  type SurveyWithComponents,
  type PortalSurveyAssignment,
} from '@tamanu/shared/schemas/patientPortal';

type SurveyResponse = SurveyWithComponents & {
  portalSurveyAssignment: PortalSurveyAssignment;
};

/** Shared with the dashboard, which loads each outstanding form ahead of it being opened. */
export const surveyQueryOptions = (api: ReturnType<typeof useApi>, surveyId: string) => ({
  queryKey: ['survey', surveyId],
  queryFn: () => api.get(`survey/${surveyId}`),
});

export const useSurveyQuery = (surveyId: string) => {
  const api = useApi();
  return useQuery<unknown, Error, SurveyResponse>({
    ...surveyQueryOptions(api, surveyId),
    enabled: Boolean(surveyId),
  });
};
