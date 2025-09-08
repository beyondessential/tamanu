import { useQuery } from '@tanstack/react-query';
import {
  PortalSurveyAssignmentSchema,
  type PortalSurveyAssignment,
} from '@tamanu/shared/schemas/patientPortal/responses/portalSurveyAssignment.schema';
import { useApi } from '../useApi';
import { transformArray } from '@utils/transformData';

export const useDesignatedFormsQuery = () => {
  const api = useApi();
  return useQuery<unknown, Error, PortalSurveyAssignment[]>({
    queryKey: ['designatedForms'],
    queryFn: () => api.get('/me/forms'),
    select: transformArray<PortalSurveyAssignment>(PortalSurveyAssignmentSchema),
  });
};
