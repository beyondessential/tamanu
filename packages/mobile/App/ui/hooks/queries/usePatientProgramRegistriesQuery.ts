import { useQuery } from '@tanstack/react-query';

import { Database } from '~/infra/db';
import { useAuth } from '~/ui/contexts/AuthContext';
import { patientKeys } from './queryKeys';

// Program registries the patient can (still) be registered into.
export default function usePatientProgramRegistriesQuery(patientId: string | undefined) {
  const { ability, user } = useAuth();
  const canListRegistrations = ability.can('list', 'PatientProgramRegistration');

  // The CASL ability (and canListRegistrations derived from it) comes entirely from the
  // signed-in user, so user.id represents it in the key.
  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  return useQuery({
    queryKey: [...patientKeys.availableRegistries(patientId), { userId: user?.id }],
    queryFn: async () => {
      if (canListRegistrations === false) return [];
      return await Database.models.ProgramRegistry.getProgramRegistriesForPatient(patientId);
    },
    enabled: !!patientId,
  });
}
