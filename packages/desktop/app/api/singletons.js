import { createContext, useContext } from 'react';
import { TamanuApi } from './TamanuApi';
import { version } from '../package.json';
import { Suggester } from '../utils/suggester';

export const API = new TamanuApi(version);
export const ApiContext = createContext(API);
export const useApi = () => useContext(ApiContext);
export const useSuggester = type => new Suggester(API, type);
