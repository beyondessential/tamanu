import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useTranslationLanguagesQuery = () => {
  const api = useApi();
  return useQuery(['languageList'], () => api.get('public/translation/languageOptions'));
};
