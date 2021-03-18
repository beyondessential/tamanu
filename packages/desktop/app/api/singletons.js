import React from 'react';
import { TamanuApi } from './TamanuApi';
import { version } from '../package.json';
import { LOCAL_STORAGE_KEYS } from '../constants';

const host = window.localStorage.getItem(LOCAL_STORAGE_KEYS.HOST);
export const API = new TamanuApi(version, host);
export const ApiContext = React.createContext(API);
