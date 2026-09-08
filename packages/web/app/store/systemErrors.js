// actions
const ADD_SYSTEM_ERROR = 'ADD_SYSTEM_ERROR';
const MARK_SYSTEM_ERRORS_READ = 'MARK_SYSTEM_ERRORS_READ';
const REMOVE_SYSTEM_ERRORS = 'REMOVE_SYSTEM_ERRORS';
const LOGOUT = 'LOGOUT';

export const addSystemError = error => ({
  type: ADD_SYSTEM_ERROR,
  error,
});

export const markSystemErrorsRead = () => ({
  type: MARK_SYSTEM_ERRORS_READ,
});

export const removeSystemErrors = ids => ({
  type: REMOVE_SYSTEM_ERRORS,
  ids,
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
    case REMOVE_SYSTEM_ERRORS:
      return {
        errors: state.errors.filter(error => !action.ids.includes(error.id)),
      };
    case LOGOUT:
      return defaultState;
    default:
      return state;
  }
};
