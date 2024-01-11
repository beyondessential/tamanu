import { useApi } from '../useApi';
import { useQuery } from '@tanstack/react-query';
import { CertificateTypes } from '@tamanu/shared/utils/patientCertificates';

export const useCovidLabTestQuery = patientId => {
  const api = useApi();

  return useQuery(
    ['covidLabTests', patientId],
    () => api.get(`patient/${patientId}/covidLabTests`, { certType: CertificateTypes.test }),
    {
      enabled: !!patientId,
    },
  );
};
