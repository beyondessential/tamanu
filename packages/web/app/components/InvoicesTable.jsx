import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import { calculateInvoiceTotal } from '../utils';

import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  INVOICE_PAYMENT_STATUS_LABELS,
  ENCOUNTER_OPTIONS_BY_VALUE,
} from '../constants';

import { useApi } from '../api';
import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { OutlinedButton } from './Button';
import { InvoiceDetailModal } from './InvoiceDetailModal';

const StatusLabel = styled.div`
  background: ${p => p.color};
  border-radius: 0.3rem;
  padding: 0.3rem;
`;

const InvoiceTotal = ({ row }) => {
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const api = useApi();

  useEffect(() => {
    (async () => {
      const { data: invoiceLines } = await api.get(`invoices/${row.id}/lineItems`);
      const { data: invoicePriceChanges } = await api.get(`invoices/${row.id}/priceChangeItems`);
      setInvoiceTotal(calculateInvoiceTotal(invoiceLines, invoicePriceChanges));
    })();
  }, [api, row.id]);

  if (row.total !== undefined && row.total !== null) {
    return `$${row.total}`;
  }
  return `$${invoiceTotal}`;
};

const ViewButton = React.memo(({ row }) => {
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const title = `Invoice number: ${row.displayId}`;

  return (
    <>
      <InvoiceDetailModal
        title={title}
        open={invoiceModalOpen}
        invoiceId={row.id}
        onClose={() => setInvoiceModalOpen(false)}
        onUpdated={row.refreshTable}
      />
      <OutlinedButton onClick={() => setInvoiceModalOpen(true)}>View</OutlinedButton>
    </>
  );
});

const StatusDisplay = React.memo(({ status }) => (
  <StatusLabel color={INVOICE_STATUS_COLORS[status] || INVOICE_STATUS_COLORS.unknown}>
    {INVOICE_STATUS_LABELS[status] || 'Unknown'}
  </StatusLabel>
));

const getDate = ({ date }) => <DateDisplay date={date} />;
const getViewButton = row => <ViewButton row={row} />;
const getInvoiceTotal = row => <InvoiceTotal row={row} />;
const getPaymentStatus = row => INVOICE_PAYMENT_STATUS_LABELS[row.paymentStatus] || 'Unknown';
const getStatus = ({ status }) => <StatusDisplay status={status} />;

const COLUMNS = [
  { key: 'date', title: 'Invoice date', accessor: getDate },
  { key: 'displayId', title: 'Invoice number' },
  { key: 'receiptNumber', title: 'Receipt number' },
  {
    key: 'encounterType',
    title: 'Admission type',
    accessor: row => ENCOUNTER_OPTIONS_BY_VALUE[row.encounter.encounterType].label,
  },
  { key: 'total', title: 'Total', accessor: getInvoiceTotal, sortable: false },
  { key: 'status', title: 'Status', accessor: getStatus },
  { key: 'paymentStatus', title: 'Payment status', accessor: getPaymentStatus },
  { key: 'view', title: 'Actions', accessor: getViewButton },
];

export const InvoicesTable = React.memo(({ patient, searchParameters }) => (
  <DataFetchingTable
    endpoint={`patient/${patient.id}/invoices`}
    columns={COLUMNS}
    noDataMessage="No invoices found"
    fetchOptions={searchParameters}
    allowExport={false}
  />
));
