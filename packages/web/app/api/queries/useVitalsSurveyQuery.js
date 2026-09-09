import { useQuery } from '@tanstack/react-query';

import { useApi } from '../index';

export const useVitalsSurveyQuery = () => {
  const api = useApi();
  const vitalsSurvey = useQuery(['survey', { type: 'vitals' }], () =>
    api.get(`survey/vitals`),
  );

  return vitalsSurvey;
};
