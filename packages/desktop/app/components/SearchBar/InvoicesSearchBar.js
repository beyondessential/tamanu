import React from 'react';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { LocalisedField, SelectField } from '../Field';
import { INVOICE_PAYMENT_STATUS_OPTIONS, INVOICE_STATUS_OPTIONS } from '../../constants';
import { TranslatedText } from '../Translation/TranslatedText';

export const InvoicesSearchBar = React.memo(({ onSearch }) => (
  <CustomisableSearchBar
    title={<TranslatedText stringId="invoices.table.search.title" fallback="Search invoices" />}
    onSearch={onSearch}
  >
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
