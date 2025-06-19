import { useQuery } from "@tanstack/react-query";
import { useApi } from "../useApi";

export const usePatientAllergiesQuery = (patientId) => {
  const api = useApi();
  return useQuery({
    queryKey: ['allergies', patientId],
    queryFn: () => api.get(`patient/${patientId}/allergies`), 
    enabled: !!patientId,
  });
};
