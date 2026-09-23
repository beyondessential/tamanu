import { useQuery } from '@tanstack/react-query';
import { Database } from '~/infra/db';
import { Patient } from '~/models/Patient';
import { patientListKeys } from './queries/queryKeys';
import { dependsOn } from './queries/queryMeta';

export default function useRecentlyViewedPatients() {
  return useQuery<Patient[]>({
    queryKey: patientListKeys.recentlyViewed(),
    queryFn: () => Patient.findRecentlyViewed(),
    // Patient eagerly loads its village
    meta: dependsOn(Patient, Database.models.ReferenceData),
  });
}
