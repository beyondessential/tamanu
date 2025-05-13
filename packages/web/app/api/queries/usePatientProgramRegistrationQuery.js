import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { PANE_SECTION_IDS } from '../../components/PatientInfoPane/paneSections';
import { useAuth } from '../../contexts/Auth';

export const usePatientProgramRegistrationQuery = (patientId, programRegistryId, fetchOptions) => {
  const api = useApi();
  const { facilityId } = useAuth();
  return useQuery(
    [`infoPaneListItem-${PANE_SECTION_IDS.PROGRAM_REGISTRY}`, patientId, programRegistryId],
    () =>
      api.get(
        `patient/${encodeURIComponent(patientId)}/programRegistration/${encodeURIComponent(
          programRegistryId,
        )}`,
        { facilityId, ...fetchOptions },
      ),
  );
};
