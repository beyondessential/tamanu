// actions
const ADD_SYSTEM_ERROR = 'ADD_SYSTEM_ERROR';
const MARK_SYSTEM_ERRORS_READ = 'MARK_SYSTEM_ERRORS_READ';
const REMOVE_SYSTEM_ERRORS = 'REMOVE_SYSTEM_ERRORS';
const PURGE_STALE_SYSTEM_ERRORS = 'PURGE_STALE_SYSTEM_ERRORS';
const LOGOUT = 'LOGOUT';

// spec: SYSERR#retention
export const SYSTEM_ERROR_RETENTION_MS = 24 * 60 * 60 * 1000;

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

// Dispatched on visiting the System errors view: there's no scheduler evicting stale
// rows in the background, so age is only ever checked at this point, against "now".
export const purgeStaleSystemErrors = (now = Date.now()) => ({
  type: PURGE_STALE_SYSTEM_ERRORS,
  now,
});

// reducers
//
// spec: SYSERR#the-system-errors-view
// spec: SYSERR#sidebar-unread-indicator

// Intended to be in-memory only, cleared on logout (see LOGOUT below) but not otherwise
// persisted — a page reload or closing the tab should lose it too. In production this
// holds: redux-persist's whitelist is empty, so nothing here reaches localStorage. In
// development, though, no whitelist is set at all (see initStore.js), so this slice
// (like every other one) is persisted to localStorage as a dev convenience and survives
// a reload — that's expected, not a bug in the reducer below.
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
    case PURGE_STALE_SYSTEM_ERRORS:
      return {
        errors: state.errors.filter(
          error => action.now - new Date(error.timestamp).getTime() < SYSTEM_ERROR_RETENTION_MS,
        ),
      };
    case LOGOUT:
      return defaultState;
    default:
      return state;
  }
};
