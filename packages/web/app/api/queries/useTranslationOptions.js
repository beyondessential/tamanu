import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

// currently only works for facility server. We need to find a way to check on login screen if it's central server or not
const isCentralServer = false;

export const useTranslationOptions = () => {
  const api = useApi();
  return useQuery(['languageList'], () =>
    api.get(`${isCentralServer ? 'public/' : ''}translation/preLogin`),
  );
};
