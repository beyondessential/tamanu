import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const usePatientProgramRegistryConditionsQuery = (registrationId, fetchOptions) => {
  const api = useApi();
  return useQuery(
    ['patient', 'programRegistration', registrationId, 'condition', fetchOptions],
    () =>
      api
        .get(
          route('patient/programRegistration/:registrationId/condition', { registrationId }),
          fetchOptions,
        )
        .then(response => response.data),
    { enabled: Boolean(registrationId) },
  );
};

export const useProgramRegistryConditionsQuery = programRegistryId => {
  const api = useApi();
  return useQuery(
    ['programRegistry', programRegistryId, 'conditions'],
    () =>
      api
        .get(route('programRegistry/:programRegistryId/conditions', { programRegistryId }), {
          orderBy: 'name',
          order: 'ASC',
        })
        .then(response => response.data),
    { enabled: Boolean(programRegistryId) },
  );
};

export const useProgramRegistryConditionCategoriesQuery = programRegistryId => {
  const api = useApi();
  return useQuery(
    ['programRegistry', programRegistryId, 'conditionCategories'],
    () =>
      api
        .get(route('programRegistry/:programRegistryId/conditionCategories', { programRegistryId }))
        .then(response => response.data),
    { enabled: Boolean(programRegistryId) },
  );
};
