import React from 'react';
import { TamanuApi } from './TamanuApi';

if (!process.env.HOST) {
  console.error('Warning: environmental variable HOST must be set');
}
export const API = new TamanuApi(process.env.HOST);
export const ApiContext = React.createContext(API);
