import React, { useState } from 'react';
import { InvoicesTable } from '../../../components/InvoicesTable';
import { CustomisableSearchBar } from '../../../components/CustomisableSearchBar';
import { StyledSelectField } from '../../../components/Field';
import { INVOICE_STATUS_OPTIONS, INVOICE_PAYMENT_STATUS_OPTIONS } from '../../../constants';

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

export const InvoicesPane = React.memo(({ patient }) => {
  const [searchParameters, setSearchParameters] = useState({});
  return (
    <>
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
        onSearch={setSearchParameters}
        shouldRenderScanFingerprint={false}
      />
      <InvoicesTable patient={patient} searchParameters={searchParameters} />
    </>
  );
});
