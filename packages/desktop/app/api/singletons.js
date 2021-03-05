import React from 'react';
import { app } from 'electron';
import { TamanuApi } from './TamanuApi';

const host = process.env.HOST;
if (!host) {
  console.error('Warning: environmental variable HOST must be set');
}
export const API = new TamanuApi(host, app.getVersion());
export const ApiContext = React.createContext(API);
