import { has } from 'lodash';
import request from './request';
import requests from './requests';

const stateChanges = { ...request, ...requests };
const initialState = {
  patient: {},
  tests: [],
  labModel: {},
  loading: false,
};

export default (state = initialState, action) => {
  return stateChanges[action.type] ? stateChanges[action.type](action, state) : state;
  return state;
};
