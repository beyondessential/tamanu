import React from 'react';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { LocalisedField, SelectField } from '../Field';
import { INVOICE_PAYMENT_STATUS_OPTIONS, INVOICE_STATUS_OPTIONS } from '../../constants';
import { TranslatedText } from '../Translation/TranslatedText';

export const InvoicesSearchBar = React.memo(({ onSearch }) => (
  <CustomisableSearchBar title="Search invoices" onSearch={onSearch}>
    <LocalisedField
      name="invoiceDisplayId"
      defaultLabel="Invoice number"
      label={
        <TranslatedText
          stringId="general.localisedField.invoiceDisplayId"
          fallback="Invoice number"
        />
      }
    />
    <LocalisedField
      name="receiptNumber"
      label={
        <TranslatedText stringId="general.localisedField.receiptNumber" fallback="Receipt number" />
      }
    />
    <LocalisedField
      name="status"
      label={<TranslatedText stringId="general.localisedField.status.label" fallback="Status" />}
      component={SelectField}
      options={INVOICE_STATUS_OPTIONS}
    />
    <LocalisedField
      name="paymentStatus"
      label={
        <TranslatedText
          stringId="general.localisedField.paymentStatus.label"
          fallback="Payment status"
        />
      }
      component={SelectField}
      options={INVOICE_PAYMENT_STATUS_OPTIONS}
    />
  </CustomisableSearchBar>
));
