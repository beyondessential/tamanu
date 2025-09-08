import { useQuery } from '@tanstack/react-query';
import {
  PortalSurveyAssignmentSchema,
  type PortalSurveyAssignment,
} from '@tamanu/shared/schemas/patientPortal/responses/portalSurveyAssignment.schema';
import { useApi } from '../useApi';
import { transformArray } from '@utils/transformData';

export const useOutstandingSurveysQuery = () => {
  const api = useApi();
  return useQuery<unknown, Error, PortalSurveyAssignment[]>({
    queryKey: ['outstandingSurveys'],
    queryFn: () => api.get('/me/surveys'),
    select: transformArray<PortalSurveyAssignment>(PortalSurveyAssignmentSchema),
  });
};
