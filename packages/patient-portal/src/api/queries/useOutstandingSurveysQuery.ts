import { useQuery } from '@tanstack/react-query';
import { type PortalSurveyAssignment } from '@tamanu/shared/schemas/patientPortal';
import { useApi } from '../useApi';

export const useOutstandingSurveysQuery = () => {
  const api = useApi();
  return useQuery<unknown, Error, PortalSurveyAssignment[]>({
    queryKey: ['outstandingSurveys'],
    queryFn: () => api.get('me/surveys/outstanding'),
  });
};
