import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useVitalsSurvey = () => {
  const api = useApi();
  return useQuery(['survey', { type: 'vitals' }], () => api.get(`survey/vitals`));
};
