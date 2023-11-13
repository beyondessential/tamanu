import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { patientProgramRegistration } from '../../../stories/utils/mockProgramRegistryData';

export const usePatientProgramRegistration = (patientId, programRegistryId, fetchOptions) => {
  const api = useApi();
  return useQuery(['PatientProgramRegistry', patientId, programRegistryId], () =>
    api.get(
      `patient/${encodeURIComponent(patientId)}/programRegistration/${encodeURIComponent(
        programRegistryId,
      )}`,
      fetchOptions,
    ),
  );
};
