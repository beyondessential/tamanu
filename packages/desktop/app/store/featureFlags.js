import { createStatePreservingReducer } from '../utils/createStatePreservingReducer';

// actions
const SET_FEATURE_FLAGS = 'SET_FEATURE_FLAGS';

export const setFeatureFlags = (featureFlags) => ({ type: SET_FEATURE_FLAGS, featureFlags });

const defaultState = {};

const actionHandlers = {
  [SET_FEATURE_FLAGS]: ({ featureFlags }) => featureFlags,
};

export const featureFlagsReducer = createStatePreservingReducer(defaultState, actionHandlers);
