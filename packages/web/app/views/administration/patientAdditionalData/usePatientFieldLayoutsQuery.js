import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../api';
import { PATIENT_FIELD_LAYOUTS_ENDPOINT } from '../constants';

export const usePatientFieldLayoutsQuery = () => {
  const api = useApi();

  return useQuery({
    queryKey: ['patientFieldLayouts'],
    queryFn: () => api.get(PATIENT_FIELD_LAYOUTS_ENDPOINT),
  });
};
