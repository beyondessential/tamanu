import { useQuery } from '@tanstack/react-query';
import { BRAND_IDS } from '@tamanu/constants';
import { useApi } from '../useApi';

const initialData = {
  brand: {
    name: 'Tamanu',
    id: BRAND_IDS.TAMANU,
  },
};
export const usePublicConfig = () => {
  const api = useApi();

  return useQuery(['public', 'localisation'], () => api.get('public/localisation'), {
    initialData,
  });
};
