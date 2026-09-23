import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { Database } from '~/infra/db';
import { registrationKeys } from './queryKeys';
import { dependsOn } from './queryMeta';

export default function useFullProgramRegistrationQuery(
  registrationId: string | undefined,
  useQueryOptions: Omit<UseQueryOptions, 'queryKey' | 'queryFn'> = {},
) {
  const { enabled = true, ...rest } = useQueryOptions;
  return useQuery({
    queryKey: registrationKeys.detail(registrationId),
    queryFn: () => Database.models.PatientProgramRegistration.getFullPprById(registrationId),
    meta: dependsOn(
      Database.models.PatientProgramRegistration,
      Database.models.ProgramRegistry,
      Database.models.Patient,
      Database.models.ProgramRegistryClinicalStatus,
      Database.models.ReferenceData,
      Database.models.Facility,
      Database.models.User,
    ),
    enabled: enabled && Boolean(registrationId),
    ...rest,
  });
}
