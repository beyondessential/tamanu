// actions
const ADD_SYSTEM_ERROR = 'ADD_SYSTEM_ERROR';
const MARK_SYSTEM_ERRORS_READ = 'MARK_SYSTEM_ERRORS_READ';
const LOGOUT = 'LOGOUT';

export const addSystemError = error => ({
  type: ADD_SYSTEM_ERROR,
  error,
});

export const markSystemErrorsRead = () => ({
  type: MARK_SYSTEM_ERRORS_READ,
});

// reducers

const defaultState = {
  errors: [],
};

export const systemErrorsReducer = (state = defaultState, action) => {
  switch (action.type) {
    case ADD_SYSTEM_ERROR:
      return {
        errors: [...state.errors, { ...action.error, isRead: false }],
      };
    case MARK_SYSTEM_ERRORS_READ:
      return {
        errors: state.errors.map(error => ({ ...error, isRead: true })),
      };
    case LOGOUT:
      return defaultState;
    default:
      return state;
  }
};
