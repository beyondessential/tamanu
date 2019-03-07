import {
  FETCH_IMAGING_REQUEST_REQUEST,
  FETCH_IMAGING_REQUEST_SUCCESS,
  FETCH_IMAGING_REQUEST_FAILED,
  SAVE_IMAGING_REQUEST_REQUEST,
  SAVE_IMAGING_REQUEST_SUCCESS,
  SAVE_IMAGING_REQUEST_FAILED,
} from '../../actions/types';

export default {
  [FETCH_IMAGING_REQUEST_REQUEST]: (_, state) => ({
    ...state,
    isLoading: true
  }),
  [FETCH_IMAGING_REQUEST_SUCCESS]: ({ patient, imagingTypes, imagingRequestModel }, state) => ({
    ...state,
    patient,
    imagingTypes,
    isLoading: false,
    imagingRequestModel,
  }),
  [FETCH_IMAGING_REQUEST_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    isLoading: false
  }),
  [SAVE_IMAGING_REQUEST_REQUEST]: (_, state) => ({
    ...state,
    isLoading: true
  }),
  [SAVE_IMAGING_REQUEST_SUCCESS]: ({ imagingRequestModel }, state) => ({
    ...state,
    isLoading: false,
    imagingRequestModel,
  }),
  [SAVE_IMAGING_REQUEST_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    isLoading: false
  }),
};
