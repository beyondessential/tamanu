import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../../api/useApi';

export const useAdminProgramRegistriesQuery = () => {
  const api = useApi();

  const getProgramRegistries = async () => {
    const response = await api.get('admin/programRegistries', { orderBy: 'name', order: 'ASC' });
    return response.data;
  };

  return useQuery({
    queryKey: ['programRegistries'],
    queryFn: getProgramRegistries,
  });
};
