import React from 'react';
import { TamanuApi } from './TamanuApi';
import { version } from '../package.json';

export const API = new TamanuApi(version);
export const ApiContext = React.createContext(API);
export const useApi = () => React.useContext(ApiContext);
