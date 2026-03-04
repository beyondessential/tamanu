import { useMemo } from 'react';
import { useAuth, useApi } from '../../contexts';
import { Suggester } from './Suggester';
import { getPatientNameAsString } from '../PatientNameDisplay';
import { DateDisplay } from '../DateDisplay';

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
  return new Suggester(api, 'patient', {
    formatter: ({ id, ...patient }) => ({
      label: `${getPatientNameAsString(patient)} (${patient.displayId}) - ${
        patient.sex
      } - ${DateDisplay.stringFormat(patient.dateOfBirth)}`,
      value: id,
    }),
  });
};
