import { useQuery } from '@tanstack/react-query';

import { Database } from '~/infra/db';
import { surveyKeys } from './queryKeys';

export default function useVitalsSurveyQuery({ includeAllVitals }: { includeAllVitals: boolean }) {
  return useQuery({
    queryKey: [...surveyKeys.vitalsSurvey(), includeAllVitals],
    queryFn: () => Database.models.Survey.getVitalsSurvey({ includeAllVitals }),
  });
}
