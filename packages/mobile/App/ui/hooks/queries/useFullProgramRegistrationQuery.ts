import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { Database } from '~/infra/db';
import { registrationKeys } from './queryKeys';

export default function useFullProgramRegistrationQuery(
  registrationId: string | undefined,
  useQueryOptions: Omit<UseQueryOptions, 'queryKey' | 'queryFn'> = {},
) {
  const { enabled = true, ...rest } = useQueryOptions;
  return useQuery({
    queryKey: registrationKeys.detail(registrationId),
    queryFn: () => Database.models.PatientProgramRegistration.getFullPprById(registrationId),
    enabled: enabled && Boolean(registrationId),
    ...rest,
  });
}
