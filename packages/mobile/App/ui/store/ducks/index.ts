import { combineReducers } from 'redux';
import { authReducer } from './auth';
import { patientReducer } from './patient';

export default combineReducers({
  patient: patientReducer,
  auth: authReducer,
});
