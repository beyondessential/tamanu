import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { Database } from '~/infra/db';
import type { PatientIssue } from '~/models/PatientIssue';
import { patientKeys } from './queryKeys';
import { dependsOn } from './queryMeta';

export default function usePatientIssuesQuery(
  patientId: string | undefined,
): UseQueryResult<PatientIssue[]> {
  return useQuery({
    queryKey: patientKeys.issues(patientId),
    queryFn: () =>
      Database.models.PatientIssue.find({
        order: { recordedDate: 'ASC' },
        where: { patient: { id: patientId } },
      }),
    meta: dependsOn(Database.models.PatientIssue),
    enabled: Boolean(patientId),
  });
}
