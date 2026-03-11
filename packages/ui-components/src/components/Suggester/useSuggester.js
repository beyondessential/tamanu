import { useMemo } from 'react';
import { useAuth, useApi, useDateTime } from '../../contexts';
import { Suggester } from './Suggester';
import { getPatientNameAsString } from '../PatientNameDisplay';

export const useSuggester = (type, options) => {
  const api = useApi();
  const { facilityId } = useAuth();

  return useMemo(
    () =>
      new Suggester(api, type, {
        ...options,
        baseQueryParameters: { facilityId, ...options?.baseQueryParameters },
      }),
    [api, type, facilityId, options],
  );
};

export const usePatientSuggester = () => {
  const api = useApi();
  const { formatShort } = useDateTime();
  return useMemo(
    () =>
      new Suggester(api, 'patient', {
        formatter: ({ id, ...patient }) => ({
          label: `${getPatientNameAsString(patient)} (${patient.displayId}) - ${patient.sex} - ${formatShort(patient.dateOfBirth)}`,
          value: id,
        }),
      }),
    [api, formatShort],
  );
};
