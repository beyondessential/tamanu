import React from 'react';
import { TamanuApi } from './TamanuApi';

const host = process.env.HOST;
if (!host) {
  console.error('Warning: environmental variable HOST must be set');
}
export const API = new TamanuApi(host);
export const ApiContext = React.createContext(API);
