// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import auth from './auth';
import patients from './patients';
import medication from './medication';
import medications from './medications';
import invoices from './invoices';
import labs from './labs';
import programs from './programs';

const rootReducer = combineReducers({
  auth,
  patients,
  router,
  medication,
  medications,
  invoices,
  labs,
  programs
});

export default rootReducer;
