import { createStatePreservingReducer } from '../utils/createStatePreservingReducer';

// actions

const OPTIONS_LOAD_START = 'OPTIONS_LOAD_START';
const OPTIONS_LOAD_FINISH = 'OPTIONS_LOAD_FINISH';

export const loadOptions = () => async (dispatch, getState, { api }) => {
  dispatch({ type: OPTIONS_LOAD_START });

  const labTestTypes = (await api.get(`labTest/options`)).data;
  const labTestCategories = (await api.get(`labTest/categories`)).data;
  // const imagingTypes = (await api.get(`imagingType`)).data;

  dispatch({
    type: OPTIONS_LOAD_FINISH,
    options: {
      labTestTypes,
      labTestCategories,
      // imagingTypes,
    },
  });
};

// selectors

export const getLabTestTypes = state => state.options.labTestTypes;
export const getLabTestCategories = state => state.options.labTestCategories;
export const getImagingTypes = state => state.options.imagingTypes;

// reducers

const defaultState = {
  labTestTypes: [],
  labTestCategories: [],
  imagingTypes: [],
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
