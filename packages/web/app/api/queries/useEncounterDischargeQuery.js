import { useQuery } from '@tanstack/react-query';
import { ERROR_TYPE } from '@tamanu/errors';
import { useApi } from '../index';

const isNotFound = error => error?.type === ERROR_TYPE.NOT_FOUND || error?.status === 404;

/**
 * The discharge record for a discharged encounter, or null when the encounter has none.
 *
 * A discharged encounter (one with an end date) does not always have a discharge record:
 * encounters closed by the outpatient discharger before v1.26.0 were given an end date and a
 * system note but no record. The server answers 404 for those, which this hook reports as
 * `null` rather than an error, so the encounter still reads as discharged everywhere.
 */
// spec: DSCHV#discharge-record
export const useEncounterDischargeQuery = (encounter, { enabled = true } = {}) => {
  const api = useApi();

  return useQuery(
    ['encounterDischarge', encounter?.id],
    async () => {
      try {
        return await api.get(`encounter/${encodeURIComponent(encounter.id)}/discharge`);
      } catch (error) {
        if (isNotFound(error)) return null;
        throw error;
      }
    },
    { enabled: Boolean(encounter?.endDate) && Boolean(encounter?.id) && enabled },
  );
};
