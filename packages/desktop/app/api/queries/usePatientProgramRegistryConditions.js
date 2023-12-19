import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientProgramRegistryConditionsQuery = (
  patientId,
  programRegistryId,
  fetchOptions,
) => {
  const api = useApi();
  return useQuery(['PatientProgramRegistryConditions', programRegistryId], () =>
    api.get(
      `patient/${encodeURIComponent(patientId)}/programRegistration/${encodeURIComponent(
        programRegistryId,
      )}/condition`,
      fetchOptions,
    ),
  );
};

export const useProgramRegistryConditionsQuery = programRegistryId => {
  const api = useApi();
  return useQuery(['programRegistryConditions'], () =>
    api
      .get(`programRegistry/${programRegistryId}/conditions`, {
        orderBy: 'name',
        order: 'ASC',
      })
      .then(response => response.data.map(x => ({ label: x.name, value: x.id }))),
  );
};
