import { useQuery } from '@tanstack/react-query';

import { Database } from '~/infra/db';
import { readConfig } from '~/services/config';
import { patientKeys } from './queryKeys';
import type { IPatient } from '~/types';

export default function usePatientIsMarkedForSyncQuery(patientId: IPatient['id'] | undefined) {
  return useQuery<boolean>({
    queryKey: patientKeys.syncStatus(patientId),
    queryFn: async () => {
      const patientFacility = await Database.models.PatientFacility.findOne({
        where: {
          patient: { id: patientId },
          facility: { id: await readConfig('facilityId', '') },
        },
      });
      return patientFacility != null;
    },
    enabled: Boolean(patientId),
  });
}
