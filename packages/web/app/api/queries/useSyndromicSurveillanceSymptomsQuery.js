import { useQuery } from '@tanstack/react-query';
import { useApi } from '../index';

/**
 * Every syndromic surveillance symptom, with "no syndrome" pinned first and the rest alphabetical
 * after it — the order the server returns them in, so this doesn't need to sort them again.
 */
export const useSyndromicSurveillanceSymptomsQuery = ({ enabled = true } = {}) => {
  const api = useApi();

  return useQuery(
    ['syndromicSurveillanceSymptoms'],
    () => api.get('suggestions/syndromicSurveillanceSymptom/list'),
    { enabled },
  );
};
