import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientProgramRegistryConditionsQuery = (registrationId, fetchOptions) => {
  const api = useApi();
  return useQuery(
    ['patient', 'programRegistration', registrationId, 'condition', fetchOptions],
    () =>
      api
        .get(`patient/programRegistration/${registrationId}/condition`, fetchOptions)
        .then(response => response.data),
    { enabled: Boolean(registrationId) },
  );
};

export const useProgramRegistryConditionsQuery = (programRegistryId) => {
  const api = useApi();
  return useQuery(
    ['programRegistry', programRegistryId, 'conditions'],
    () =>
      api
        .get(`programRegistry/${programRegistryId}/conditions`, {
          orderBy: 'name',
          order: 'ASC',
        })
        .then(response => response.data),
    { enabled: Boolean(programRegistryId) },
  );
};

export const useProgramRegistryConditionCategoriesQuery = (programRegistryId) => {
  const api = useApi();
  return useQuery(
    ['programRegistry', programRegistryId, 'conditionCategories'],
    () =>
      api
        .get(`programRegistry/${programRegistryId}/conditionCategories`)
        .then(response => response.data),
    { enabled: Boolean(programRegistryId) },
  );
};
