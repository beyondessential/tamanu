import React from 'react';

import { INVOICE_STATUS_OPTIONS, INVOICE_PAYMENT_STATUS_OPTIONS } from '../constants';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { StyledSelectField } from './Field';

const StatusField = props => (
  <StyledSelectField
    {...props}
    className="styled-select-container"
    classNamePrefix="styled-select"
  />
);

const PaymentStatusField = props => (
  <StyledSelectField
    {...props}
    className="styled-select-container"
    classNamePrefix="styled-select"
    style={{ borderRight: '1px solid #dedede' }}
  />
);

export const InvoicesSearchBar = ({ searchParameters, setSearchParameters, ...props }) => (
  <CustomisableSearchBar
    title="Search invoices"
    fields={[
      ['invoiceDisplayId', { placeholder: 'Invoice number' }],
      ['receiptNumber', { placeholder: 'Receipt number' }],
      [
        'status',
        { placeholder: 'Status', component: StatusField, options: INVOICE_STATUS_OPTIONS },
      ],
      [
        'paymentStatus',
        {
          placeholder: 'Payment status',
          component: PaymentStatusField,
          options: INVOICE_PAYMENT_STATUS_OPTIONS,
        },
      ],
    ]}
    initialValues={searchParameters}
    onSearch={setSearchParameters}
    shouldRenderScanFingerprint={false}
    {...props}
  />
);
