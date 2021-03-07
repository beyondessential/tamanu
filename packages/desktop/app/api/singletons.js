import React from 'react';
import { TamanuApi } from './TamanuApi';
import { version } from '../package.json';

const host = process.env.HOST;
if (!host) {
  console.error('Warning: environmental variable HOST must be set');
}
export const API = new TamanuApi(host, version);
export const ApiContext = React.createContext(API);
