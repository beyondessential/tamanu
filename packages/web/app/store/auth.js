import { createStatePreservingReducer } from '../utils/createStatePreservingReducer';

// actions
const LOGIN_START = 'LOGIN_START';
const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
const LOGIN_FAILURE = 'LOGIN_FAILURE';
const LOGOUT = 'LOGOUT';
const LOGOUT_WITH_ERROR = 'LOGOUT_WITH_ERROR';
const REQUEST_PASSWORD_RESET_START = 'REQUEST_PASSWORD_RESET_START';
const REQUEST_PASSWORD_RESET_SUCCESS = 'REQUEST_PASSWORD_RESET_SUCCESS';
const REQUEST_PASSWORD_RESET_FAILURE = 'REQUEST_PASSWORD_RESET_FAILURE';
const PASSWORD_RESET_RESTART = 'PASSWORD_RESET_RESTART';
const CHANGE_PASSWORD_START = 'CHANGE_PASSWORD_START';
const CHANGE_PASSWORD_SUCCESS = 'CHANGE_PASSWORD_SUCCESS';
const CHANGE_PASSWORD_FAILURE = 'CHANGE_PASSWORD_FAILURE';
const VALIDATE_RESET_CODE_START = 'VALIDATE_RESET_CODE_START';
const VALIDATE_RESET_CODE_COMPLETE = 'VALIDATE_RESET_CODE_COMPLETE';
const SET_FACILITY_ID = 'SET_FACILITY_ID';

export const restoreSession = () => async (dispatch, getState, { api }) => {
  try {
    const {
      user,
      token,
      localisation,
      server,
      facilities,
      ability,
      role,
      settings,
    } = await api.restoreSession();
    // if there's just one facility the user has access to, select it immediately
    // otherwise they will be prompted to select a facility after login
    const facilityId = facilities.length === 1 ? [0] : null;
    dispatch({
      type: LOGIN_SUCCESS,
      user,
      token,
      localisation,
      server,
      facilities,
      facilityId,
      ability,
      role,
      settings,
    });
  } catch (e) {
    // no action required -- this just means we haven't logged in
  }
};

export const login = (email, password) => async (dispatch, getState, { api }) => {
  dispatch({ type: LOGIN_START });

  try {
    const {
      user,
      token,
      localisation,
      server,
      facilities,
      ability,
      role,
      settings,
    } = await api.login(email, password);
    // if there's just one facility the user has access to, select it immediately
    // otherwise they will be prompted to select a facility after login
    console.log(facilities);
    const facilityId = facilities.length === 1 ? [0] : null;
    dispatch({
      type: LOGIN_SUCCESS,
      user,
      token,
      localisation,
      server,
      facilities,
      facilityId,
      ability,
      role,
      settings,
    });
  } catch (error) {
    dispatch({ type: LOGIN_FAILURE, error: error.message });
  }
};

export const setFacilityId = facilityId => async dispatch => {
  dispatch({
    type: SET_FACILITY_ID,
    facilityId,
  });
};

export const authFailure = () => async dispatch => {
  dispatch({
    type: LOGOUT_WITH_ERROR,
    error: 'Your session has expired. Please log in again.',
  });
};

export const versionIncompatible = message => async dispatch => {
  dispatch({
    type: LOGOUT_WITH_ERROR,
    error: message,
  });
};

export const logout = () => ({
  type: LOGOUT,
});

export const idleTimeout = () => ({
  type: LOGOUT_WITH_ERROR,
  error: 'You have been logged out due to inactivity',
});

export const requestPasswordReset = email => async (dispatch, getState, { api }) => {
  dispatch({ type: REQUEST_PASSWORD_RESET_START });

  try {
    await api.requestPasswordReset(email);
    dispatch({ type: REQUEST_PASSWORD_RESET_SUCCESS, email });
  } catch (error) {
    dispatch({ type: REQUEST_PASSWORD_RESET_FAILURE, error: error.message });
  }
};

export const restartPasswordResetFlow = () => async dispatch => {
  dispatch({ type: PASSWORD_RESET_RESTART });
};

export const validateResetCode = data => async (dispatch, getState, { api }) => {
  dispatch({ type: VALIDATE_RESET_CODE_START });

  await api.post('changePassword/validate-reset-code', data);
  dispatch({ type: VALIDATE_RESET_CODE_COMPLETE });
};

export const changePassword = data => async (dispatch, getState, { api }) => {
  dispatch({ type: CHANGE_PASSWORD_START });

  try {
    await api.changePassword(data);
    dispatch({ type: CHANGE_PASSWORD_SUCCESS });
  } catch (error) {
    dispatch({ type: CHANGE_PASSWORD_FAILURE, error: error.message });
  }
};

// selectors
export const getCurrentUser = ({ auth }) => auth.user;
export const checkIsLoggedIn = state => !!getCurrentUser(state);
export const checkIsFacilitySelected = ({ auth }) => !!auth.facilityId;

// reducer
const defaultState = {
  loading: false,
  user: null,
  ability: null,
  error: null,
  token: null,
  localisation: null,
  role: null,
  server: null,
  settings: null,
  facilities: [],
  facilityId: null,
  resetPassword: {
    loading: false,
    success: false,
    error: null,
    lastEmailUsed: null,
  },
  changePassword: {
    loading: false,
    success: false,
    error: null,
  },
  validateResetCode: {
    loading: false,
    success: false,
    error: null,
  },
};

const resetState = {
  user: defaultState.user,
  role: defaultState.role,
  facilities: defaultState.facilities,
  facility: defaultState.facility,
  error: defaultState.error,
  token: null,
};

const actionHandlers = {
  [LOGIN_START]: () => ({
    loading: true,
    ...resetState,
  }),
  [LOGIN_SUCCESS]: action => ({
    loading: false,
    user: action.user,
    ability: action.ability,
    facilities: action.facilities,
    facilityId: action.facilityId,
    error: defaultState.error,
    token: action.token,
    localisation: action.localisation,
    server: action.server,
    role: action.role,
    settings: action.settings,
    resetPassword: defaultState.resetPassword,
    changePassword: defaultState.changePassword,
  }),
  [SET_FACILITY_ID]: action => ({
    facilityId: action.facilityId,
  }),
  [LOGIN_FAILURE]: action => ({
    loading: false,
    error: action.error,
  }),
  [LOGOUT_WITH_ERROR]: ({ error }) => ({
    ...resetState,
    error,
  }),
  [LOGOUT]: () => ({
    ...resetState,
  }),
  [REQUEST_PASSWORD_RESET_START]: () => ({
    resetPassword: {
      ...defaultState.resetPassword,
      loading: true,
    },
  }),
  [REQUEST_PASSWORD_RESET_SUCCESS]: ({ email }) => ({
    resetPassword: {
      ...defaultState.resetPassword,
      success: true,
      lastEmailUsed: email,
    },
    changePassword: {
      ...defaultState.changePassword, // reset form for next step
    },
  }),
  [PASSWORD_RESET_RESTART]: () => ({
    resetPassword: {
      ...defaultState.resetPassword,
    },
  }),
  [REQUEST_PASSWORD_RESET_FAILURE]: action => ({
    resetPassword: {
      ...defaultState.resetPassword,
      error: action.error,
    },
  }),
  [CHANGE_PASSWORD_START]: () => ({
    changePassword: {
      ...defaultState.changePassword,
      loading: true,
    },
  }),
  [CHANGE_PASSWORD_SUCCESS]: () => ({
    resetPassword: defaultState.resetPassword,
    changePassword: {
      ...defaultState.changePassword,
      success: true,
    },
  }),
  [CHANGE_PASSWORD_FAILURE]: action => ({
    changePassword: {
      ...defaultState.changePassword,
      error: action.error,
    },
  }),
  [VALIDATE_RESET_CODE_START]: () => ({
    validateResetCode: {
      ...defaultState.validateResetCode,
      loading: true,
    },
  }),
  [VALIDATE_RESET_CODE_COMPLETE]: () => ({
    validateResetCode: {
      ...defaultState.validateResetCode,
      completed: true,
    },
  }),
};

export const authReducer = createStatePreservingReducer(defaultState, actionHandlers);
