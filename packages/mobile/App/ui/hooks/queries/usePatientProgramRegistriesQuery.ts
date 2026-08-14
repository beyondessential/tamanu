import { useQuery } from '@tanstack/react-query';

import { Database } from '~/infra/db';
import { useAuth } from '~/ui/contexts/AuthContext';
import { patientKeys } from './queryKeys';

// Program registries the patient can (still) be registered into.
export default function usePatientProgramRegistriesQuery(patientId: string | undefined) {
  const { ability, user } = useAuth();

  return useQuery({
    queryKey: [...patientKeys.availableRegistries(patientId), { userId: user?.id }],
    queryFn: async () => {
      const canListRegistrations = ability.can('list', 'PatientProgramRegistration');
      if (canListRegistrations === false) return [];
      return await Database.models.ProgramRegistry.getProgramRegistriesForPatient(patientId);
    },
    enabled: Boolean(patientId),
  });
}
