import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { Database } from '~/infra/db';
import type { PatientAdditionalData } from '~/models/PatientAdditionalData';
import { patientKeys } from './queryKeys';

/**
 * The bare PatientAdditionalData record, unlike usePatientAdditionalData which also loads custom
 * field definitions and values.
 */
export default function usePatientAdditionalDataRecordQuery(
  patientId: string | undefined,
): UseQueryResult<PatientAdditionalData | null> {
  return useQuery({
    queryKey: [...patientKeys.additionalData(patientId), 'record'],
    queryFn: () =>
      Database.models.PatientAdditionalData.getRepository().findOne({
        where: {
          patient: { id: patientId },
        },
      }),
    enabled: Boolean(patientId),
  });
}
