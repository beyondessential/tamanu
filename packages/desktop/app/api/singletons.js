import React from 'react';
import { TamanuApi } from './TamanuApi';
import { version } from '../package.json';
import { Suggester } from '../utils/suggester';

export const API = new TamanuApi(version);
export const ApiContext = React.createContext(API);
export const useApi = () => React.useContext(ApiContext);
export const useSuggester = type => new Suggester(API, type);
