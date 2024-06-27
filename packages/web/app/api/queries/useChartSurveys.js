import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useChartSurveys = () => {
  const api = useApi();

  return useQuery(['charts'], () => api.get('/charts/surveys'));
};
