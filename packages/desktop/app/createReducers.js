import { connectRouter } from 'connected-react-router';
import { authReducer } from './auth';

import { patientReducer } from './store/patient';

export const createReducers = history => ({ 
  auth: authReducer, 
  router: connectRouter(history),
  patient: patientReducer,
});
