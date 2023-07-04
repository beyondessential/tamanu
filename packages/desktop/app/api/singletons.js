import { TamanuApi } from './TamanuApi';
import packagej from '../package.json';

export const API = new TamanuApi(packagej.version);
