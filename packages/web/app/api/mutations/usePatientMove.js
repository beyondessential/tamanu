import { useMutation } from '@tanstack/react-query';
import { useDateTime } from '@tamanu/ui-components';
import { useApi } from '../useApi';
import { useInvalidateEncounter } from '../queries/useEncounterQuery';

export const usePatientMove = (encounterId, onClose) => {
  const { getCurrentDateTime } = useDateTime();
  const api = useApi();
  const invalidateEncounter = useInvalidateEncounter();

  return useMutation({
    mutationKey: ['patientMove', encounterId],
    mutationFn: async (data) => {
      await api.put(`encounter/${encounterId}`, {
        ...data,
        submittedTime: getCurrentDateTime(),
      });
    },
    onSuccess: async () => {
      onClose();
      await invalidateEncounter(encounterId);
    },
  });
};
