// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import patients from './patients';
import medications from './medications';
import invoices from './invoices';
import labs from './labs';
import programs from './programs';

const rootReducer = combineReducers({
  patients,
  router,
  medications,
  invoices,
  labs,
  programs
});

export default rootReducer;
