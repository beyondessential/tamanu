// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import patients from './patients';
import medications from './medications';
import invoices from './invoices';

const rootReducer = combineReducers({
  patients,
  router,
  medications,
  invoices
});

export default rootReducer;
