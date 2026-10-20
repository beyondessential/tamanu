import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

const transformData = response => {
  if (!response.data) {
    return [];
  }
  return response.data
    .filter(patientCondition => !patientCondition.resolved)
    .map(patientCondition => ({ ...patientCondition, diagnosis: patientCondition.condition }))
    .sort((a, b) => a.diagnosis.name.localeCompare(b.diagnosis.name));
};
export const usePatientConditionsQuery = patientId => {
  const api = useApi();
  return useQuery(
    ['conditions', patientId],
    () => api.get(route('patient/:patientId/conditions', { patientId })),
    {
      placeholderData: [],
      select: transformData,
    },
  );
};
