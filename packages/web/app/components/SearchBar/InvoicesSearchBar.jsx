import React from 'react';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { LocalisedField } from '../Field';
import { INVOICE_PAYMENT_STATUS_LABELS, INVOICE_STATUS_LABELS } from '@tamanu/constants';
import { TranslatedText } from '../Translation/TranslatedText';
import { TranslatedSelectField } from '../Translation/TranslatedSelect';

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
      enumValues={INVOICE_STATUS_LABELS}
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
      enumValues={INVOICE_PAYMENT_STATUS_LABELS}
    />
  </CustomisableSearchBar>
));
