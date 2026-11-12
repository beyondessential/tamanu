import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const AI_PATIENT_SUMMARY_QUERY_KEY = 'aiPatientSummary';

export const useAiPatientSummaryQuery = patientId => {
  const api = useApi();
  return useQuery(
    [AI_PATIENT_SUMMARY_QUERY_KEY, patientId],
    () => api.get(route('ai/patient/summary/:patientId', { patientId })),
    { enabled: !!patientId, staleTime: 0 },
  );
};
