import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { isErrorUnknownAllow404s } from '../TamanuApi';

export const useLatestAnswerForPatient = (patientId, dataElementCode) => {
  const api = useApi();

  return useQuery(
    ['survey', patientId, dataElementCode],
    () =>
      api.get(
        `surveyResponseAnswer/latest-answer/${encodeURIComponent(dataElementCode)}`,
        {
          patientId,
        },
        { isErrorUnknown: isErrorUnknownAllow404s },
      ),
    {
      enabled: !!patientId && !!dataElementCode,
    },
  );
};
