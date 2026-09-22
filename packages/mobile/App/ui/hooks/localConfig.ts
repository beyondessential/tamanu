import { useQuery } from '@tanstack/react-query';
import { Patient } from '~/models/Patient';
import { patientListKeys } from './queries/queryKeys';

export default function useRecentlyViewedPatients() {
  return useQuery<Patient[]>({
    queryKey: patientListKeys.recentlyViewed(),
    queryFn: () => Patient.findRecentlyViewed(),
  });
}
