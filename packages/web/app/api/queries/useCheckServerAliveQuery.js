import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

let debugN = Math.floor(Math.random() * 2);
export const useCheckServerAliveQuery = () => {
  const api = useApi();

  return useQuery(['serverAlive'], () => {
    console.log('BBBBBBBBBB', debugN);
    if (debugN % 2 !== 0) {
      debugN += 1;
      return false;
    }
    return api.checkServerAlive();
  });
};
