import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { useMutation } from '@tanstack/react-query';
import { useEncounter } from '../../contexts/Encounter';
import { useApi } from '../useApi';

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
