import { useContext } from 'react';
import { ApiContext } from './ApiContext';
import { TamanuApi } from './TamanuApi';

export const useApi = (): TamanuApi => {
  const api = useContext(ApiContext);
  if (!api) {
    throw new Error('Tamanu API not available: missing ApiContext.Provider');
  }
  return api;
};
