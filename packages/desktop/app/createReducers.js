import { connectRouter } from 'connected-react-router';
import { authReducer } from './auth';

export const createReducers = history => ({ auth: authReducer, router: connectRouter(history) });
