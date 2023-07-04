import { reloadPatient } from './patient';

// actions
const IMAGING_LOAD_START = 'IMAGING_LOAD_START';
const IMAGING_LOAD_ERROR = 'IMAGING_LOAD_ERROR';
const IMAGING_LOAD_FINISH = 'IMAGING_LOAD_FINISH';

export const reloadImagingRequest = id => async (dispatch, getState, { api }) => {
  dispatch({ type: IMAGING_LOAD_START, id });

  try {
    const imagingRequest = await api.get(`imagingRequest/${id}`);

    const encounter = imagingRequest.encounters?.[0];
    if (encounter) {
      const patient = encounter.patient[0];
      if (patient) {
        dispatch(reloadPatient(patient.id));
      }
    }

    dispatch({ type: IMAGING_LOAD_FINISH, imagingRequest });
  } catch (e) {
    dispatch({ type: IMAGING_LOAD_ERROR, error: e });
  }
};

// reducers

const defaultState = {
  loading: true,
  id: null,
  error: null,
};

export const imagingRequestReducer = (state = defaultState, action) => {
  switch (action.type) {
    case IMAGING_LOAD_START:
      return {
        loading: true,
        id: action.id,
        error: null,
      };
    case IMAGING_LOAD_ERROR:
      return {
        loading: false,
        error: action.error,
      };
    case IMAGING_LOAD_FINISH:
      return {
        loading: false,
        error: null,
        ...action.imagingRequest,
      };
    default:
      return state;
  }
};
