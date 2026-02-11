import { useQuery } from '@tanstack/react-query';
import { useApi } from '../index';
import { useAuth } from '../../contexts/Auth';

export const useEncounterMedicationQuery = (encounterId, fetchOptions) => {
  const { facilityId } = useAuth();
  const api = useApi();

  const options = {
    facilityId,
    ...fetchOptions,
  };

  return useQuery(['encounterMedication', encounterId, options], () =>
    api.get(`encounter/${encodeURIComponent(encounterId)}/medications`, options),
    { enabled: !!encounterId },
  );
};
