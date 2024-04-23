import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

const transformData = response => {
  if (!response.data) {
    return [];
  }
  return response.data
    .filter(patientCondition => !patientCondition.resolved)
    .map(patientCondition => ({ ...patientCondition, diagnosis: patientCondition.condition }))
    .sort((a, b) => a.diagnosis.name.localeCompare(b.diagnosis.name));
};
export const usePatientConditions = patientId => {
  const api = useApi();
  return useQuery(['conditions', patientId], () => api.get(`patient/${patientId}/conditions`), {
    placeholderData: [],
    select: transformData,
  });
};
