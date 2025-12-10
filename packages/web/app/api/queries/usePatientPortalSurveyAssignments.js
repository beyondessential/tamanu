import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientPortalSurveyAssignments = patientId => {
  const api = useApi();
  return useQuery(
    ['patient', patientId, 'portalForms'],
    () => api.get(`patient/${patientId}/portal/forms`),
    {
      enabled: Boolean(patientId),
    },
  );
};
