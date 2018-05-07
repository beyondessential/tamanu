import {
  CREATE_INVOICE_REQUEST,
  CREATE_INVOICE_SUCCESS,
  CREATE_INVOICE_FAILED,
  FETCH_INVOICES_REQUEST,
  FETCH_INVOICES_SUCCESS,
  FETCH_INVOICES_FAILED,
} from '../actions/types';

const initialState = {
  invoices: []
};

export default (state = initialState, action) => {
  switch (action.type) {
    case CREATE_INVOICE_REQUEST:
      return {
        ...state,
      };
    case CREATE_INVOICE_SUCCESS:
      return {
        ...state,
      };
    case CREATE_INVOICE_FAILED:
      return {
        ...state,
      };
    case FETCH_INVOICES_REQUEST:
      return {
        ...state,
      };
    case FETCH_INVOICES_SUCCESS:
      return {
        ...state,
        invoices: action.payload
      };
    case FETCH_INVOICES_FAILED:
      return {
        ...state,
      };
    default:
      return state;
  }
};
