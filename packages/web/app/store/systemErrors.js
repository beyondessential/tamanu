// actions
const ADD_SYSTEM_ERROR = 'ADD_SYSTEM_ERROR';
const LOGOUT = 'LOGOUT';

export const addSystemError = error => ({
  type: ADD_SYSTEM_ERROR,
  error,
});

// reducers

// Seeded so the System errors view has something to show/test against before the
// real relegation flow (see `relegateSystemError`) has produced any errors of its
// own this session — timestamps are relative to load time so sorting has something
// to demonstrate. TODO: remove once relegation has been in place long enough that
// a freshly-logged-in session doesn't need seed data to be useful to look at.
const hoursAgo = hours => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

const SEED_SYSTEM_ERRORS = [
  {
    id: '1',
    timestamp: hoursAgo(0.2),
    message:
      'Something went wrong on the server. Path: patient/123. Message: Unexpected token in JSON',
  },
  {
    id: '2',
    timestamp: hoursAgo(3),
    message:
      'Something went wrong on the server. Path: labRequest/all. Message: Connection terminated unexpectedly',
  },
  {
    id: '3',
    timestamp: hoursAgo(9),
    message:
      'Something went wrong on the server. Path: appointments/outpatients. Message: relation "appointments" does not exist',
  },
  {
    id: '4',
    timestamp: hoursAgo(11),
    message:
      'Something went wrong on the server. Path: encounter/456. Message: Unexpected server error',
  },
  {
    id: '5',
    timestamp: hoursAgo(13),
    message:
      'Something went wrong on the server. Path: medication/789. Message: Unexpected server error',
  },
  {
    id: '6',
    timestamp: hoursAgo(15),
    message:
      'Something went wrong on the server. Path: imaging/orders. Message: Unexpected server error',
  },
  {
    id: '7',
    timestamp: hoursAgo(17),
    message:
      'Something went wrong on the server. Path: vaccine/schedule. Message: Unexpected server error',
  },
  {
    id: '8',
    timestamp: hoursAgo(19),
    message:
      'Something went wrong on the server. Path: invoice/234. Message: Unexpected server error',
  },
  {
    id: '9',
    timestamp: hoursAgo(21),
    message:
      'Something went wrong on the server. Path: programRegistry/enrol. Message: Unexpected server error',
  },
  {
    id: '10',
    timestamp: hoursAgo(23),
    message:
      'Something went wrong on the server. Path: patient/search. Message: Unexpected server error',
  },
  {
    id: '11',
    timestamp: hoursAgo(25),
    message:
      'Something went wrong on the server. Path: survey/response. Message: Unexpected server error',
  },
  {
    id: '12',
    timestamp: hoursAgo(27),
    message:
      'Something went wrong on the server. Path: user/tasks. Message: Unexpected server error',
  },
  {
    id: '13',
    timestamp: hoursAgo(29),
    message:
      'Something went wrong on the server. Path: facility/locations. Message: Unexpected server error',
  },
  {
    id: '14',
    timestamp: hoursAgo(31),
    message:
      'Something went wrong on the server. Path: reports/generate. Message: Unexpected server error',
  },
  {
    id: '15',
    timestamp: hoursAgo(33),
    message: 'Something went wrong on the server. Path: sync/pull. Message: Unexpected server error',
  },
];

const defaultState = {
  errors: SEED_SYSTEM_ERRORS,
};

export const systemErrorsReducer = (state = defaultState, action) => {
  switch (action.type) {
    case ADD_SYSTEM_ERROR:
      return {
        errors: [...state.errors, action.error],
      };
    case LOGOUT:
      return defaultState;
    default:
      return state;
  }
};
