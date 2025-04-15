import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

const transformData = response => {
  if (!response.data) {
    return [];
  }
  return response.data
    .map(patientAllergy => ({
      ...patientAllergy,
      allergy: patientAllergy.allergy.name,
      reaction: patientAllergy.reaction.name,
    }))
    .sort((a, b) => a.diagnosis.name.localeCompare(b.diagnosis.name));
};
export const usePatientAllergiesQuery = patientId => {
  const api = useApi();
  return useQuery(['allergies', patientId], () => api.get(`patient/${patientId}/allergies`), {
    placeholderData: [],
    select: transformData,
  });
};
