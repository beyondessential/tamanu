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
          stringId="general.localisedFields.invoiceDisplayId"
          defaultLabel="Invoice number.label"
          fallback="TODO"
        />
      }
    />
    <LocalisedField
      name="receiptNumber"
      defaultLabel="Receipt number"
      label={
        <TranslatedText
          stringId="general.localisedFields.receiptNumber"
          defaultLabel="Receipt number.label"
          fallback="TODO"
        />
      }
    />
    <LocalisedField
      name="status"
      label={<TranslatedText stringId="general.localisedFields.status.label" fallback="TODO" />}
      component={SelectField}
      options={INVOICE_STATUS_OPTIONS}
      defaultLabel="Status"
    />
    <LocalisedField
      name="paymentStatus"
      label={
        <TranslatedText stringId="general.localisedFields.paymentStatus.label" fallback="TODO" />
      }
      defaultLabel="Payment status"
      component={SelectField}
      options={INVOICE_PAYMENT_STATUS_OPTIONS}
    />
  </CustomisableSearchBar>
));
