import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { calculateInvoiceTotal } from 'shared/utils';

import { getAdmissionType } from '../utils';
import { useApi } from '../api';
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  INVOICE_PAYMENT_STATUS_LABELS,
} from '../constants';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { TextButton } from './Button';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { reloadPatient } from '../store/patient';

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
      const { data: invoiceLines } = await api.get(`invoices/${row.id}/invoiceLineItems`);
      const { data: invoicePriceChanges } = await api.get(
        `invoices/${row.id}/invoicePriceChangeItems`,
      );
      setInvoiceTotal(calculateInvoiceTotal(invoiceLines, invoicePriceChanges));
    })();
  }, []);

  return `$${invoiceTotal}`;
};

const ViewButton = React.memo(({ row, patientId }) => {
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const title = `Invoice number: ${row.displayId}`;
  const dispatch = useDispatch();

  const handleSave = useCallback(async () => {
    setInvoiceModalOpen(false);
    dispatch(reloadPatient(patientId));
  }, [patientId]);

  return (
    <>
      <InvoiceDetailModal
        title={title}
        open={invoiceModalOpen}
        invoiceId={row.id}
        onClose={() => setInvoiceModalOpen(false)}
        onSaved={handleSave}
      />
      <TextButton onClick={() => setInvoiceModalOpen(true)}>View</TextButton>
    </>
  );
});

const StatusDisplay = React.memo(({ status }) => (
  <StatusLabel color={INVOICE_STATUS_COLORS[status] || INVOICE_STATUS_COLORS.unknown}>
    {INVOICE_STATUS_LABELS[status] || 'Unknown'}
  </StatusLabel>
));

const getDate = ({ date }) => (date ? <DateDisplay date={date} /> : '');
const getViewButton = patientId => row => <ViewButton patientId={patientId} row={row} />;
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
    accessor: row => getAdmissionType(row.encounter?.encounterType),
  },
  { key: 'total', title: 'Total', accessor: getInvoiceTotal, sortable: false },
  { key: 'status', title: 'Status', accessor: getStatus },
  { key: 'paymentStatus', title: 'Payment status', accessor: getPaymentStatus },
];

export const InvoicesTable = React.memo(({ patient, searchParameters }) => {
  const columns = [
    ...COLUMNS,
    { key: 'view', title: 'Actions', accessor: getViewButton(patient.id) },
  ];

  return (
    <DataFetchingTable
      endpoint={`patient/${patient.id}/invoices`}
      columns={columns}
      noDataMessage="No invoices found"
      fetchOptions={searchParameters}
    />
  );
});
