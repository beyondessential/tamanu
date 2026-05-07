import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const AI_PATIENT_SUMMARY_QUERY_KEY = 'aiPatientSummary';

export const useAiPatientSummaryQuery = patientId => {
  const api = useApi();
  return useQuery(
    [AI_PATIENT_SUMMARY_QUERY_KEY, patientId],
    () => api.get(`ai/patient/summary/${encodeURIComponent(patientId)}`),
    { enabled: !!patientId },
  );
};
