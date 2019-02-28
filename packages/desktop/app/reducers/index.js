import { combineReducers } from 'redux';
import auth from './auth';
import patients from './patients';
import medication from './medication';
import medications from './medications';
import invoices from './invoices';
import labs from './labs';
import programs from './programs';
import scheduling from './scheduling';

const rootReducer = combineReducers({
  auth,
  patients,
  medication,
  medications,
  invoices,
  labs,
  programs,
  scheduling
});

export default rootReducer;
