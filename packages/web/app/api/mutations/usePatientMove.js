import { useMutation } from '@tanstack/react-query';
import { useDateTime } from '@tamanu/ui-components';
import { useApi } from '../useApi';
import { useEncounter } from '../../contexts/Encounter';
import { route } from '@tamanu/api-client';

export const usePatientMove = (encounterId, onClose) => {
  const { getCurrentDateTime } = useDateTime();
  const api = useApi();
  const { loadEncounter } = useEncounter();

  return useMutation({
    mutationKey: ['patientMove', encounterId],
    mutationFn: async data => {
      await api.put(route('encounter/:encounterId', { encounterId }), {
        ...data,
        submittedTime: getCurrentDateTime(),
      });
    },
    onSuccess: async () => {
      onClose();
      await loadEncounter(encounterId);
    },
  });
};
