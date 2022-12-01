import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useVitalsSurvey = () => {
  const api = useApi();
  // Todo: update to use vitals survey endpoint
  const VITALS_SURVEY_ID = 'program-patientvitals-patientvitals';

  return useQuery(['survey', { type: 'vitals' }], () =>
    api.get(`survey/${encodeURIComponent(VITALS_SURVEY_ID)}`),
  );
};
