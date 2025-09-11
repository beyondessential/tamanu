import { Suggester } from '../utils/suggester';
import { useApi } from './useApi';
import { getPatientNameAsString } from '../components/PatientNameDisplay';
import { DateDisplay } from '../components/DateDisplay';
import { useAuth } from '../contexts/Auth';
import { useMemo } from 'react';

export const useSuggester = (type, options) => {
  const api = useApi();
  const { facilityId } = useAuth();

  return useMemo(
    () =>
      new Suggester(api, type, {
        ...options,
        baseQueryParameters: { 
          ...(facilityId && facilityId.trim() && { facilityId }), 
          ...options?.baseQueryParameters 
        },
      }),
    [api, type, facilityId, options],
  );
};

export const usePatientSuggester = () => {
  const api = useApi();
  return new Suggester(api, 'patient', {
    formatter: ({ id, ...patient }) => ({
      label: `${getPatientNameAsString(patient)} (${patient.displayId}) - ${
        patient.sex
      } - ${DateDisplay.stringFormat(patient.dateOfBirth)}`,
      value: id,
    }),
  });
};
