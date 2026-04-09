import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../../api';
import { COLUMNS_ENDPOINT } from './constants';

export const useReferenceDataColumns = selectedType => {
  const api = useApi();

  return useQuery({
    queryKey: ['referenceData', 'columns', selectedType],
    queryFn: () => api.get(COLUMNS_ENDPOINT, { type: selectedType }),
    enabled: Boolean(selectedType),
  });
};
