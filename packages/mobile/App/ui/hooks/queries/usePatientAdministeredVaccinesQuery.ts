import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { Database } from '~/infra/db';
import type { IAdministeredVaccine } from '~/types';
import { patientKeys } from './queryKeys';
import { dependsOn } from './queryMeta';

export default function usePatientAdministeredVaccinesQuery(
  patientId: string | undefined,
): UseQueryResult<IAdministeredVaccine[]> {
  return useQuery({
    queryKey: patientKeys.administeredVaccines(patientId),
    queryFn: () => Database.models.AdministeredVaccine.getForPatient(patientId),
    meta: dependsOn(
      Database.models.AdministeredVaccine,
      Database.models.Encounter,
      Database.models.User,
      Database.models.ReferenceData,
      Database.models.ScheduledVaccine,
      Database.models.Location,
      Database.models.Department,
      Database.models.LocationGroup,
    ),
    enabled: Boolean(patientId),
  });
}
