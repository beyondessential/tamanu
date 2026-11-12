import { useQuery } from '@tanstack/react-query';

import { useApi } from '@tamanu/ui-components';
import { useAuth } from '../../contexts/Auth';
import { route } from '@tamanu/api-client';

export const useEncounterMedicationQuery = (encounterId, fetchOptions) => {
  const { facilityId } = useAuth();
  const api = useApi();

  const options = {
    facilityId,
    ...fetchOptions,
  };

  return useQuery({
    queryKey: ['encounterMedication', encounterId, options],
    queryFn: async () =>
      await api.get(route('encounter/:encounterId/medications', { encounterId }), options),
    enabled: !!encounterId,
  });
};
