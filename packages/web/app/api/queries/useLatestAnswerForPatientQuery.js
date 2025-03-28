import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { isErrorUnknownAllow404s } from '../TamanuApi';
import { useAuth } from '../../contexts/Auth';

export const useLatestAnswerForPatientQuery = (patientId, dataElementCode) => {
  const api = useApi();
  const { facilityId } = useAuth();
  return useQuery(
    ['survey', patientId, dataElementCode],
    () =>
      api.get(
        `surveyResponseAnswer/latest-answer/${encodeURIComponent(dataElementCode)}`,
        {
          patientId,
          facilityId,
        },
        { isErrorUnknown: isErrorUnknownAllow404s },
      ),
    {
      enabled: !!patientId && !!dataElementCode,
    },
  );
};
