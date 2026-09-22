import { useQuery } from '@tanstack/react-query';
import { Patient } from '~/models/Patient';
import { patientListKeys } from './queries/queryKeys';

const options = {
  queryKey: patientListKeys.recentlyViewed(),
  queryFn: () => Patient.findRecentlyViewed(),
} as const;

export default function useRecentlyViewedPatients() {
  return useQuery<Patient[]>(options);
}
