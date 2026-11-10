import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useProgramRegistryClinicalStatusQuery = (
  patientId,
  programRegistryId,
  fetchOptions,
) => {
  const api = useApi();

  return useQuery(['patient', patientId, 'programRegistration', programRegistryId, 'history'], () =>
    api
      .get(
        route('patient/:patientId/programRegistration/:programRegistryId/history', {
          patientId,
          programRegistryId,
        }),
        fetchOptions,
      )
      .then(response => response.data),
  );
};
