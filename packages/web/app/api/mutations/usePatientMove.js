import { useMutation } from '@tanstack/react-query';
import { useDateTimeFormat } from '@tamanu/ui-components';
import { useApi } from '../useApi';
import { useEncounter } from '../../contexts/Encounter';

export const usePatientMove = (encounterId, onClose) => {
  const { getCountryCurrentDateTimeString } = useDateTimeFormat();
  const api = useApi();
  const { loadEncounter } = useEncounter();

  return useMutation({
    mutationKey: ['patientMove', encounterId],
    mutationFn: async (data) => {
      await api.put(`encounter/${encounterId}`, {
        ...data,
        submittedTime: getCountryCurrentDateTimeString(),
      });
    },
    onSuccess: async () => {
      onClose();
      await loadEncounter(encounterId);
    },
  });
};
