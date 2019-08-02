import { routerReducer } from 'react-router-redux';
import { authReducer } from './auth';

export const reducers = { auth: authReducer, router: routerReducer };
