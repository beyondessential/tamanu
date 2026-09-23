import { useQuery } from '@tanstack/react-query';

import { Database } from '~/infra/db';
import { readConfig } from '~/services/config';
import { patientKeys } from './queryKeys';
import { dependsOn } from './queryMeta';
import type { IPatient } from '~/types';

export default function usePatientIsMarkedForSyncQuery(patientId: IPatient['id'] | undefined) {
  return useQuery<boolean>({
    queryKey: patientKeys.syncStatus(patientId),
    queryFn: async () => {
      return Database.models.PatientFacility.existsBy({
        patient: { id: patientId },
        facility: { id: await readConfig('facilityId', '') },
      });
    },
    meta: dependsOn(Database.models.PatientFacility),
    enabled: Boolean(patientId),
  });
}
