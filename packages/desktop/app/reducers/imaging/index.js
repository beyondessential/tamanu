import request from './request';

const stateChanges = { ...request };
const initialState = {
  patient: {},
  imagingTypes: [],
  imagingRequestModel: {},
  isLoading: false,
};

export default (state = initialState, action) => {
  return stateChanges[action.type] ? stateChanges[action.type](action, state) : state;
};
