import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

export const useSurveyResponseQuery = surveyResponseId => {
  const api = useApi();
  const { facilityId } = useAuth();

  return useQuery(
    ['surveyResponse', surveyResponseId],
    () => api.get(`surveyResponse/${surveyResponseId}`, { facilityId }),
    { enabled: !!surveyResponseId },
  );
};
