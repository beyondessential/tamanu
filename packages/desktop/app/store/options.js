import { createStatePreservingReducer } from '../utils/createStatePreservingReducer';

// actions

const OPTIONS_LOAD_START = 'OPTIONS_LOAD_START';
const OPTIONS_LOAD_FINISH = 'OPTIONS_LOAD_FINISH';

export const loadOptions = () => async (dispatch, getState, { api }) => {
  dispatch({ type: OPTIONS_LOAD_START });

  const labTestTypes = (await api.get(`labTest/options`)).data;
  const labTestCategories = (await api.get(`labTest/categories`)).data;
  const labTestPriorities = (await api.get(`labTest/priorities`)).data;

  dispatch({
    type: OPTIONS_LOAD_FINISH,
    options: {
      labTestTypes,
      labTestCategories,
      labTestPriorities,
    },
  });
};

// selectors

export const getLabTestTypes = state => state.options.labTestTypes;
export const getLabTestCategories = state => state.options.labTestCategories;
export const getLabTestPriorities = state => state.options.labTestPriorities;

// reducers

const defaultState = {
  labTestTypes: [],
  labTestCategories: [],
  labTestPriorities: [],
  loading: false,
};

const handlers = {
  [OPTIONS_LOAD_START]: () => ({
    loading: true,
  }),
  [OPTIONS_LOAD_FINISH]: action => ({
    loading: false,
    ...action.options,
  }),
};

export const optionsReducer = createStatePreservingReducer(defaultState, handlers);
