import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const usePatientPortalSurveyAssignments = patientId => {
  const api = useApi();
  return useQuery(
    ['patient', patientId, 'portalForms'],
    () => api.get(route('patient/:patientId/portal/forms', { patientId })),
    {
      enabled: Boolean(patientId),
    },
  );
};
