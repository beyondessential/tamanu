import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useTranslationLanguages = () => {
  const api = useApi();
  return useQuery(['languageList'], () => api.get('public/translation/preLogin'));
};
