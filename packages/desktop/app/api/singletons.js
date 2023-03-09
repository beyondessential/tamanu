import { TamanuApi } from './TamanuApi';
import pkg from '../package.json';

export const API = new TamanuApi(pkg.version);
