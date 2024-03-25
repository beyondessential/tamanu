import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { PANE_SECTION_IDS } from '../../components/PatientInfoPane/paneSections';

export const usePatientProgramRegistration = (patientId, programRegistryId, fetchOptions) => {
  const api = useApi();
  return useQuery([`infoPaneListItem-${PANE_SECTION_IDS.PROGRAM_REGISTRY}`, patientId, programRegistryId], () =>
    api.get(
      `patient/${encodeURIComponent(patientId)}/programRegistration/${encodeURIComponent(
        programRegistryId,
      )}`,
      fetchOptions,
    ),
  );
};
