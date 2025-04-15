import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useTelegramBotInfoQuery = () => {
  const api = useApi();

  return useQuery(['telegramBotInfo'], () => api.get('telegram/bot-info'));
};
