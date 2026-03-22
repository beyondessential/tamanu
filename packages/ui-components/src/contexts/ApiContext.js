import { createContext, useContext } from 'react';

export const ApiContext = createContext();

export const useApi = () => useContext(ApiContext);
