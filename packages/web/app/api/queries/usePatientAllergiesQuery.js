import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

const transformData = response => {
  if (!response.data) {
    return [];
  }

  return response.data.map(item => ({
    ...item,
    allergy: item?.allergy || {},
    reaction: item?.reaction || {},
  }));
};
export const usePatientAllergiesQuery = patientId => {
  const api = useApi();
  return useQuery(['allergies', patientId], () => api.get(`patient/${patientId}/allergies`), {
    placeholderData: [],
    select: transformData,
  });
};
