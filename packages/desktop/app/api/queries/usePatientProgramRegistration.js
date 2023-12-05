import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { PROGRAM_REGISTRY } from '../../components/PatientInfoPane/paneTitles';

export const usePatientProgramRegistration = (patientId, programRegistryId, fetchOptions) => {
  const api = useApi();
  return useQuery([`infoPaneListItem-${PROGRAM_REGISTRY}`, patientId, programRegistryId], () =>
    api.get(
      `patient/${encodeURIComponent(patientId)}/programRegistration/${encodeURIComponent(
        programRegistryId,
      )}`,
      fetchOptions,
    ),
  );
};
