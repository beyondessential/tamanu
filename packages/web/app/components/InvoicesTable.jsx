import React, { useState } from 'react';
import styled from 'styled-components';

import { Colors, ENCOUNTER_OPTIONS_BY_VALUE, INVOICE_PAYMENT_STATUS_LABELS } from '../constants';

import { DataFetchingTable } from './Table';
import { DateDisplay } from './DateDisplay';
import { TranslatedEnum, TranslatedText } from './Translation';
import { Typography } from '@material-ui/core';
import { ThemedTooltip } from './Tooltip';
import { upperCase } from 'lodash';
import { InvoiceStatus } from './InvoiceStatus';
import { EditInvoiceModal } from './EditInvoiceModal';

const TableTitle = styled(Typography)`
  font-size: 16px;
  font-weight: 500;
  padding: 15px 20px;
  border-bottom: 1px solid ${Colors.outline};
`;

const Table = styled(DataFetchingTable)`
  .MuiTableCell-head {
    background-color: ${Colors.white};
    padding-top: 8px !important;
    padding-bottom: 8px !important;
    span {
      font-weight: 400;
      color: ${Colors.midText} !important;
    }
  }
  .MuiTableCell-body {
    padding-top: 6px !important;
    padding-bottom: 6px !important;
  }
  .MuiTableBody-root .MuiTableRow-root {
    cursor: pointer;
    &:hover {
      background-color: ${Colors.veryLightBlue};
    }
  }
`;

const InvoiceTotal = () => {
  return `$0`;
};

const getDate = ({ date }) => <DateDisplay date={date} />;
const getInvoiceTotal = row => <InvoiceTotal row={row} />;
const getPaymentStatus = row => (
  <TranslatedEnum
    prefix="invoice.payment.property.status"
    value={row.paymentStatus}
    enumValues={INVOICE_PAYMENT_STATUS_LABELS}
  />
);
const getEncounterType = row => {
  const label = ENCOUNTER_OPTIONS_BY_VALUE[row.encounter.encounterType]?.label || '';
  const abbreviationLabel = upperCase(
    label
      .split(' ')
      .map(it => it[0])
      .join(''),
  );
  return (
    <ThemedTooltip title={label}>
      <span>{abbreviationLabel}</span>
    </ThemedTooltip>
  );
};
const getStatus = ({ status }) => <InvoiceStatus status={status} />;

const COLUMNS = [
  {
    key: 'date',
    title: <TranslatedText stringId="patient.invoice.table.column.date" fallback="Date" />,
    accessor: getDate,
  },
  {
    key: 'displayId',
    title: (
      <TranslatedText stringId="patient.invoice.table.column.displayId" fallback="Invoice number" />
    ),
  },
  {
    key: 'encounterType',
    title: (
      <TranslatedText stringId="patient.invoice.table.column.encounterType" fallback="Admission" />
    ),
    accessor: getEncounterType,
  },
  {
    key: 'total',
    title: <TranslatedText stringId="patient.invoice.table.column.total" fallback="Total" />,
    accessor: getInvoiceTotal,
  },
  {
    key: 'paymentStatus',
    title: (
      <TranslatedText
        stringId="patient.invoice.table.column.paymentStatus"
        fallback="Payment status"
      />
    ),
    accessor: getPaymentStatus,
  },
  {
    key: 'status',
    title: <TranslatedText stringId="patient.invoice.table.column.status" fallback="Status" />,
    accessor: getStatus,
  },
];

export const InvoicesTable = React.memo(({ patient }) => {
  const [selectedInvoice, setSelectedInvoice] = useState();

  return (
    <>
      <Table
        endpoint={`patient/${patient.id}/invoices`}
        columns={COLUMNS}
        noDataMessage={
          <TranslatedText stringId="patient.invoice.table.noData" fallback="No invoices found" />
        }
        allowExport={false}
        inlineTitle={
          <TableTitle>
            <TranslatedText stringId="patient.invoice.table.title" fallback="Patient invoices" />
          </TableTitle>
        }
        onClickRow={(_, data) => setSelectedInvoice(data)}
      />
      {!!selectedInvoice && (
        <EditInvoiceModal
          open
          onClose={() => setSelectedInvoice(undefined)}
          invoice={selectedInvoice}
          afterSaveInvoice={selectedInvoice.refreshTable}
        />
      )}
    </>
  );
});
