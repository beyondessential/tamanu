import { useQuery } from '@tanstack/react-query';

import {
  PortalSurveyAssignmentSchema,
  type PortalSurveyAssignment,
} from '@tamanu/shared/schemas/patientPortal/responses/portalSurveyAssignment.schema';
import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';
import { transformArray } from '@utils/transformData';

export const useOutstandingFormsQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, PortalSurveyAssignment[]>({
    queryKey: ['outstandingForms', user?.id],
    queryFn: () => api.get('/me/forms/outstanding'),
    enabled: !!user?.id,
    select: transformArray<PortalSurveyAssignment>(PortalSurveyAssignmentSchema),
  });
};
