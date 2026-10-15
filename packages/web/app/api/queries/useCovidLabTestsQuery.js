import { useApi } from '../useApi';
import { useQuery } from '@tanstack/react-query';
import { CertificateTypes } from '@tamanu/shared/utils/patientCertificates';
import { route } from '@tamanu/api-client';

export const useCovidLabTestQuery = (patientId, certType = CertificateTypes.test) => {
  const api = useApi();

  return useQuery(
    ['covidLabTests', patientId, certType],
    () => api.get(route('patient/:patientId/covidLabTests', { patientId }), { certType }),
    {
      enabled: !!(patientId && certType),
    },
  );
};
