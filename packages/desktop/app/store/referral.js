import { createStatePreservingReducer } from '../utils/createStatePreservingReducer';

// actions
const REFERRAL_LOAD_START = 'REFERRAL_LOAD_START';
const REFERRAL_LOAD_FINISH = 'REFERRAL_LOAD_FINISH';

export const viewReferral = id => async dispatch => {
  dispatch(reloadReferral(id));
  // TODO: display completed referral form
  // dispatch(push('/patients/referral'));
};

export const reloadReferral = id => async (dispatch, getState, { api }) => {
  dispatch({ type: REFERRAL_LOAD_START, id });

  const referral = await api.get(`referral/${id}`);
  // TODO handle error state

  dispatch({ type: REFERRAL_LOAD_FINISH, referral });
};

// reducers

const defaultState = {
  loading: true,
  id: null,
};

const handlers = {
  [REFERRAL_LOAD_START]: action => ({
    loading: true,
    id: action.id,
  }),
  [REFERRAL_LOAD_FINISH]: action => ({
    loading: false,
    ...action.referral,
  }),
};

export const referralReducer = createStatePreservingReducer(defaultState, handlers);
