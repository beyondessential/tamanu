import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { Patient } from '~/models/Patient';
import { patientListKeys } from './queries/queryKeys';

// Invalidated from the patient store duck whenever a patient is selected (which is what
// updates the recentlyViewedPatients config entry), and via `patientListKeys.all` after a
// patient is edited or a survey that writes patient fields is submitted.
export const useRecentlyViewedPatients = (): UseQueryResult<Patient[]> =>
  useQuery({
    queryKey: patientListKeys.recentlyViewed(),
    queryFn: () => Patient.findRecentlyViewed(),
  });
