import { connectRouter } from 'connected-react-router';

import {
  authReducer,
  patientReducer,
  optionsReducer,
  imagingRequestReducer,
  decisionSupportReducer,
} from './store';

export const createReducers = history => ({
  router: connectRouter(history),
  auth: authReducer,
  patient: patientReducer,
  options: optionsReducer,
  imagingRequest: imagingRequestReducer,
  decisionSupport: decisionSupportReducer,
});
