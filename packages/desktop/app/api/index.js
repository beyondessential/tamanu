import { createContext, useContext } from 'react';
import { Suggester } from '../utils/suggester';

export { connectApi } from './connectApi';

export const ApiContext = createContext();
export const useApi = () => useContext(ApiContext);
export const useSuggester = type => {
  const api = useApi()
  return new Suggester(api, type);
};
