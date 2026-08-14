import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { Database } from '~/infra/db';
import { PatientFacility } from '~/models/PatientFacility';
import { readConfig } from '~/services/config';
import { patientKeys } from './queryKeys';

// A PatientFacility row for the current facility means the patient is marked for sync.
export default function usePatientFacilityQuery(
  patientId: string | undefined,
): UseQueryResult<PatientFacility | null> {
  return useQuery({
    queryKey: patientKeys.syncStatus(patientId),
    queryFn: async () =>
      Database.models.PatientFacility.findOne({
        where: {
          patient: { id: patientId },
          facility: { id: await readConfig('facilityId', '') },
        },
      }),
    enabled: Boolean(patientId),
  });
}
