import { toast } from 'react-toastify';
import {
  FETCH_MEDICATION_REQUEST,
  FETCH_MEDICATION_SUCCESS,
  FETCH_MEDICATION_FAILED,
  SAVE_MEDICATION_REQUEST,
  SAVE_MEDICATION_SUCCESS,
  SAVE_MEDICATION_FAILED,
} from '../../actions/types';

export default {
  [FETCH_MEDICATION_REQUEST]: (_, state) => ({
    ...state,
    loading: true
  }),
  [FETCH_MEDICATION_SUCCESS]: ({ patient, medication }, state) => ({
    ...state,
    patient,
    medication,
    loading: false
  }),
  [FETCH_MEDICATION_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    loading: false
  }),
  [SAVE_MEDICATION_REQUEST]: (_, state) => ({
    ...state,
    loading: true
  }),
  [SAVE_MEDICATION_SUCCESS]: (_, state) => {
    toast('Medication added successfully.', { type: 'success' });
    return { ...state, loading: false }
  },
  [SAVE_MEDICATION_FAILED]: ({ error }, state) => ({
    ...state,
    error,
    loading: false
  }),
};
