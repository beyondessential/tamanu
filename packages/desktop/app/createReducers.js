import { connectRouter } from 'connected-react-router';

import { authReducer } from './store/auth';
import { patientReducer } from './store/patient';
import { visitReducer } from './store/visit';

export const createReducers = history => ({
  auth: authReducer,
  router: connectRouter(history),
  patient: patientReducer,
  visit: visitReducer,
});
