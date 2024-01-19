import { useMutation } from '@tanstack/react-query';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { useApi } from '../useApi';
import { useEncounter } from '../../contexts/Encounter';

export const usePatientMove = (encounterId, onClose) => {
  const api = useApi();
  const { loadEncounter } = useEncounter();

  return useMutation({
    mutationKey: ['patientMove', encounterId],
    mutationFn: async data => {
      await api.put(`encounter/${encounterId}`, {
        ...data,
        submittedTime: getCurrentDateTimeString(),
      });
    },
    onSuccess: async () => {
      onClose();
      await loadEncounter(encounterId);
    },
  });
};
