import React from 'react';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { LocalisedField, BaseSelectField } from '../Field';
import { INVOICE_PAYMENT_STATUS_OPTIONS, INVOICE_STATUS_OPTIONS } from '../../constants';
import { TranslatedText } from '../Translation/TranslatedText';
import { TranslatedSelectField } from '../Translation/TranslatedSelectField.jsx';

export const InvoicesSearchBar = React.memo(({ onSearch }) => (
  <CustomisableSearchBar title="Search invoices" onSearch={onSearch}>
    <LocalisedField
      name="invoiceDisplayId"
      defaultLabel="Invoice number"
      label={
        <TranslatedText
          stringId="general.localisedField.invoiceDisplayId.label"
          fallback="Invoice number"
        />
      }
    />
    <LocalisedField
      name="receiptNumber"
      label={
        <TranslatedText
          stringId="general.localisedField.receiptNumber.label"
          fallback="Receipt number"
        />
      }
    />
    <LocalisedField
      name="status"
      label={<TranslatedText stringId="general.localisedField.status.label" fallback="Status" />}
      component={TranslatedSelectField}
      options={INVOICE_STATUS_OPTIONS}
      prefix="invoice.property.status"
    />
    <LocalisedField
      name="paymentStatus"
      label={
        <TranslatedText
          stringId="general.localisedField.paymentStatus.label"
          fallback="Payment status"
        />
      }
      component={TranslatedSelectField}
      options={INVOICE_PAYMENT_STATUS_OPTIONS}
      prefix="invoice.property.paymentStatus"
    />
  </CustomisableSearchBar>
));
