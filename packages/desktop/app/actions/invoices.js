import {
  CREATE_INVOICE_REQUEST,
  CREATE_INVOICE_SUCCESS,
  CREATE_INVOICE_FAILED,
  FETCH_INVOICES_REQUEST,
  FETCH_INVOICES_SUCCESS,
  FETCH_INVOICES_FAILED,
} from './types';
import { idGenerator } from '../constants';

export function createInvoiceRequest() {
  return {
    type: CREATE_INVOICE_REQUEST
  };
}

export function createInvoiceSuccess(invoice) {
  return {
    type: CREATE_INVOICE_SUCCESS,
    payload: invoice
  };
}

export function createInvoiceFailed() {
  return {
    type: CREATE_INVOICE_FAILED
  };
}

export function fetchInvoicesRequest() {
  return {
    type: FETCH_INVOICES_REQUEST
  };
}

export function fetchInvoicesSuccess(invoices) {
  return {
    type: FETCH_INVOICES_SUCCESS,
    payload: invoices
  };
}

export function fetchInvoicesFailed() {
  return {
    type: FETCH_INVOICES_FAILED
  };
}

export const createInvoice = invoice => {
  return dispatch => {
    dispatch(createInvoiceRequest());
    const existingInvoices = JSON.parse(localStorage.getItem('invoices')) || [];
    const invoiceInfo = invoice;
    invoiceInfo.id = idGenerator();
    existingInvoices.push(invoiceInfo);
    localStorage.setItem('invoices', JSON.stringify(existingInvoices));
  };
};

export const fetchInvoices = () => {
  return dispatch => {
    dispatch(fetchInvoicesRequest());
    const existingInvoices = JSON.parse(localStorage.getItem('invoices')) || [];
    dispatch(fetchInvoicesSuccess(existingInvoices));
  };
};
