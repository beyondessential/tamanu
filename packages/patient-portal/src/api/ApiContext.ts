import { createContext } from 'react';
import { TamanuApi } from './TamanuApi';

export const ApiContext = createContext<TamanuApi | null>(null);
