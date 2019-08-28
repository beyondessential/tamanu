import { createReducer } from '../utils/createReducer';

// actions

const OPTIONS_LOAD_START = 'OPTIONS_LOAD_START';
const OPTIONS_LOAD_FINISH = 'OPTIONS_LOAD_FINISH';

export const loadOptions = () => async (dispatch, getState, { api }) => {
  dispatch({ type: OPTIONS_LOAD_START });

  const labTestTypes = (await api.get(`labTestType`)).data;
  const labTestCategories = (await api.get(`labTestCategory`)).data;

  dispatch({
    type: OPTIONS_LOAD_FINISH, 
    options: {
      labTestTypes,
      labTestCategories,
    }
  });
};

// selectors

export const getLabTestTypes = (state, categoryId) => state.options.labTestTypes;
export const getLabTestCategories = (state) => state.options.labTestCategories;

// reducers

const defaultState = {
  labTestTypes: [],
  labTestCategories: [],
  loading: false,
};

const handlers = {
  [OPTIONS_LOAD_START]: action => ({
    loading: true,
  }),
  [OPTIONS_LOAD_FINISH]: action => ({
    loading: false,
    ...action.options,
  }),
};

export const optionsReducer = createReducer(defaultState, handlers);

