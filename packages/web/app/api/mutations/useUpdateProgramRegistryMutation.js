import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi.js';
import { PANE_SECTION_IDS } from '../../components/PatientInfoPane/paneSections.jsx';
import { route } from '@tamanu/api-client';

export const useUpdateProgramRegistryMutation = (patientId, registrationId) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    data => {
      return api.put(
        route('patient/programRegistration/:registrationId', { registrationId }),
        data,
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([`infoPaneListItem-${PANE_SECTION_IDS.PROGRAM_REGISTRY}`]);
        queryClient.invalidateQueries(['patient', patientId]);
        queryClient.invalidateQueries(['patient', 'programRegistration', registrationId]);
      },
    },
  );
};
