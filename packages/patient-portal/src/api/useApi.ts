import { useContext } from 'react';

import { ApiContext } from './ApiContext';
import type { TamanuApi } from './TamanuApi';

export const useApi = (): TamanuApi => {
  const api = useContext(ApiContext);

  if (!api) {
    throw new Error('useApi must be used within an ApiProvider');
  }

  return api;
};
