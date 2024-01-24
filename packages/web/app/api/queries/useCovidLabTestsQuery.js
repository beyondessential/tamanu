import { useApi } from '../useApi';
import { useQuery } from '@tanstack/react-query';
import { CertificateTypes } from '@tamanu/shared/utils/patientCertificates';

export const useCovidLabTestQuery = (patientId, certType = CertificateTypes.test) => {
  const api = useApi();

  return useQuery(
    ['covidLabTests', patientId, certType],
    () => api.get(`patient/${patientId}/covidLabTests`, { certType }),
    {
      enabled: !!(patientId && certType),
    },
  );
};
