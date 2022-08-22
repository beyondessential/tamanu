import { useContext } from 'react';
import { Suggester } from '../utils/suggester';
import { ApiContext } from './ApiContext';

export * from './ApiContext';
export * from './connectApi';

export const useApi = () => useContext(ApiContext);
export const useSuggester = (type, options) => {
  const api = useApi();
  return new Suggester(api, type, options);
};
