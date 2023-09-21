import { useQuery } from '@tanstack/react-query';

import { useApi, isErrorUnknownAllow404s } from '../index';

export const useVitalsSurveyQuery = () => {
  const api = useApi();
  const vitalsSurvey = useQuery(['survey', { type: 'vitals' }], () =>
    api.get(`survey/vitals`, {}, { isErrorUnknown: isErrorUnknownAllow404s }),
  );

  return vitalsSurvey;
};
