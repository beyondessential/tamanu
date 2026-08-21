import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { Database } from '~/infra/db';
import { IAdministeredVaccine } from '~/types';
import { patientKeys } from './queryKeys';

export default function usePatientAdministeredVaccinesQuery(
  patientId: string | undefined,
): UseQueryResult<IAdministeredVaccine[]> {
  return useQuery({
    queryKey: patientKeys.administeredVaccines(patientId),
    queryFn: () => Database.models.AdministeredVaccine.getForPatient(patientId),
    enabled: Boolean(patientId),
  });
}
