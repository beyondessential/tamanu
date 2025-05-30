// actions
const PATIENT_LOAD_START = 'PATIENT_LOAD_START';
const PATIENT_LOAD_ERROR = 'PATIENT_LOAD_ERROR';
const PATIENT_LOAD_FINISH = 'PATIENT_LOAD_FINISH';
const PATIENT_CLEAR = 'PATIENT_CLEAR';
const PATIENT_SYNCING = 'PATIENT_SYNCING';

export const clearPatient = () => ({
  type: PATIENT_CLEAR,
});

export const reloadPatient =
  (id) =>
  async (dispatch, getState, { api }) => {
    dispatch({ type: PATIENT_LOAD_START, id });

    const { auth } = getState();
    const { facilityId } = auth;

    try {
      const patient = await api.get(`patient/${id}`, { facilityId });

      dispatch({
        type: PATIENT_LOAD_FINISH,
        patient,
      });
    } catch (e) {
      dispatch({ type: PATIENT_LOAD_ERROR, error: e });
    }
  };

// reducers

const defaultState = {
  loading: true,
  id: null,
  error: null,
  issues: [],
};

export const patientReducer = (state = defaultState, action) => {
  switch (action.type) {
    case PATIENT_LOAD_START:
      return {
        ...state,
        loading: true,
        id: action.id,
        error: null,
        issues: [],
      };
    case PATIENT_LOAD_ERROR:
      return {
        ...state,
        loading: false,
        error: action.error,
      };
    case PATIENT_LOAD_FINISH:
      return {
        ...state,
        loading: false,
        error: null,
        ...action.patient,
      };
    case PATIENT_CLEAR:
      return defaultState;
    case PATIENT_SYNCING:
      return {
        ...state,
        syncing: action.data,
      };
    default:
      return state;
  }
};
