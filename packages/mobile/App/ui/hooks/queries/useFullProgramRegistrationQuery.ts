import { useQuery } from '@tanstack/react-query';

import { Database } from '~/infra/db';
import { registrationKeys } from './queryKeys';

// Shared by the registration details stack and screen: both use the same key, so the
// record is fetched once and served from the cache thereafter.
export default function useFullProgramRegistrationQuery(
  registrationId: string | undefined,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: registrationKeys.detail(registrationId),
    queryFn: () => Database.models.PatientProgramRegistration.getFullPprById(registrationId),
    enabled: enabled && !!registrationId,
  });
}
