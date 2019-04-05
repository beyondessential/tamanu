import moment from 'moment';
import { has } from 'lodash';
import patient from './patient';
import patients from './patients';
import visits from './visits';
import procedures from './procedures';
import operativePlan from './operativePlan';
import operationReport from './operationReport';

const stateChanges = {
  ...patient,
  ...patients,
  ...visits,
  ...procedures,
  ...operativePlan,
  ...operationReport,
};
const initialState = {
  patient: {},
  patientInProgress: false,
  createPatientSuccess: false,
  deletePatientSuccess: false,
  updatedBirthday: moment(),
  updatedReferredDate: moment(),
  visit: {},
  procedureModel: {},
  operativePlanModel: {},
  operationReportModel: {},
  action: '',
  saved: false,
};

export default (state = initialState, action) => {
  if (has(stateChanges, action.type)) return stateChanges[action.type](action, state);
  return state;
};
