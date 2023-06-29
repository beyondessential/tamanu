import { Suggester } from '../utils/suggester';
import { useApi } from './useApi';
import { getPatientNameAsString } from '../components/PatientNameDisplay';
import { DateDisplay } from '../components/DateDisplay';

export const useSuggester = (type, options) => {
  const api = useApi();
  return new Suggester(api, type, options);
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
