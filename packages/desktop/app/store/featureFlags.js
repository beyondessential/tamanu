// actions
const SET_FEATURE_FLAGS = 'SET_FEATURE_FLAGS';

export const setFeatureFlags = () => ({ type: SET_FEATURE_FLAGS });

const defaultState = null;

const actionHandlers = {
  [SET_FEATURE_FLAGS]: (featureFlags) => {
    return { featureFlags };
  },
};

export const featureFlagsReducer = createStatePreservingReducer(defaultState, actionHandlers);
