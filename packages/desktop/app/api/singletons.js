import React from 'react';
import { TamanuApi } from './TamanuApi';

export const API = new TamanuApi(process.env.HOST);
export const ApiContext = React.createContext(API);
