import React from 'react';
import { INVOICE_PAYMENT_STATUS_OPTIONS, INVOICE_STATUS_OPTIONS } from '../../constants';
import { LocalisedField, SelectField } from '../Field';
import { CustomisableSearchBar } from './CustomisableSearchBar';

export const InvoicesSearchBar = React.memo(({ onSearch }) => (
  <CustomisableSearchBar title="Search invoices" onSearch={onSearch}>
    <LocalisedField name="invoiceDisplayId" defaultLabel="Invoice number" />
    <LocalisedField name="receiptNumber" defaultLabel="Receipt number" />
    <LocalisedField
      name="status"
      component={SelectField}
      options={INVOICE_STATUS_OPTIONS}
      defaultLabel="Status"
    />
    <LocalisedField
      name="paymentStatus"
      defaultLabel="Payment status"
      component={SelectField}
      options={INVOICE_PAYMENT_STATUS_OPTIONS}
    />
  </CustomisableSearchBar>
));
