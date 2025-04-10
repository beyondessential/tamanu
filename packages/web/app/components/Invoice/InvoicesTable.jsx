import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  INVOICE_PATIENT_PAYMENT_STATUSES_LABELS,
  INVOICE_INSURER_PAYMENT_STATUSES,
  INVOICE_INSURER_PAYMENT_STATUS_LABELS,
  INVOICE_STATUSES,
} from '@tamanu/constants';
import { formatShortest } from '@tamanu/utils/dateTime';

import { Colors, ENCOUNTER_OPTIONS_BY_VALUE, INVOICE_MODAL_TYPES } from '../../constants';
import { DataFetchingTable } from '../Table';
import { TranslatedEnum, TranslatedText } from '../Translation';
import { Typography } from '@material-ui/core';
import { ThemedTooltip } from '../Tooltip';
import { upperCase } from 'lodash';
import { InvoiceStatus } from './InvoiceStatus';
import { InvoiceModalGroup } from './InvoiceModalGroup';
import {
  formatDisplayPrice,
  getInvoiceSummary,
  getInvoiceSummaryDisplay,
} from '@tamanu/shared/utils/invoice';
import {
  useEncounterInvoiceQuery,
  useInvoiceTotalOutstandingBalanceQuery,
} from '../../api/queries/useInvoiceQuery';
import { useAuth } from '../../contexts/Auth';

const TableTitle = styled(Typography)`
  font-size: 16px;
  font-weight: 500;
  padding: 15px 20px;
  border-bottom: 1px solid ${Colors.outline};
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
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
    padding-left: 11px;
    padding-right: 11px;
    &:last-child {
      padding-right: 20px;
    }
    &:first-child {
      padding-left: 20px;
    }
  }
  .MuiTableCell-body {
    padding-top: 6px !important;
    padding-bottom: 6px !important;
    padding-left: 11px;
    padding-right: 11px;
    &:last-child {
      padding-right: 20px;
    }
    &:first-child {
      padding-left: 20px;
    }
  }
  .MuiTableBody-root .MuiTableRow-root:not(.statusRow) {
    cursor: ${props => (props.onClickRow ? 'pointer' : '')};
    &:hover {
      background-color: ${props => (props.onClickRow ? Colors.veryLightBlue : '')};
    }
  }
`;

const getDate = ({ date }) => formatShortest(date);
const getInvoiceTotal = row => {
  const { patientTotal } = getInvoiceSummaryDisplay(row);
  return patientTotal === undefined ? (
    <TranslatedText stringId="general.fallback.notApplicable" fallback="N/A" casing="lower" />
  ) : (
    `$${patientTotal}`
  );
};
const getPaymentStatus = row => {
  if (row.status !== INVOICE_STATUSES.FINALISED) {
    return (
      <TranslatedText stringId="general.fallback.notApplicable" fallback="N/A" casing="lower" />
    );
  }
  return (
    <>
      <TranslatedEnum
        value={row.patientPaymentStatus}
        enumValues={INVOICE_PATIENT_PAYMENT_STATUSES_LABELS}
      />
      {/* The payment status refers to the patient contribution only UNLESS the insurer has rejected the payment,
      in which case the status is followed by a /Rejected */}
      {row.insurerPaymentStatus === INVOICE_INSURER_PAYMENT_STATUSES.REJECTED && (
        <>
          {'/'}
          <TranslatedEnum
            value={row.insurerPaymentStatus}
            enumValues={INVOICE_INSURER_PAYMENT_STATUS_LABELS}
          />
        </>
      )}
    </>
  );
};
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

const getRemainingBalance = row => {
  if (row.status !== INVOICE_STATUSES.FINALISED)
    return (
      <TranslatedText stringId="general.fallback.notApplicable" fallback="N/A" casing="lower" />
    );
  const { patientPaymentRemainingBalance } = getInvoiceSummary(row);
  const remainingBalance = formatDisplayPrice(Math.max(0, patientPaymentRemainingBalance));
  return `$${remainingBalance}`;
};

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
    key: 'patientTotal',
    title: (
      <TranslatedText
        stringId="patient.invoice.table.column.patientTotal"
        fallback="Patient total"
      />
    ),
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
    key: 'balance',
    title: <TranslatedText stringId="patient.invoice.table.column.balance" fallback="Balance" />,
    accessor: getRemainingBalance,
  },
  {
    key: 'status',
    title: <TranslatedText stringId="patient.invoice.table.column.status" fallback="Status" />,
    accessor: getStatus,
  },
];

export const InvoicesTable = ({ patient }) => {
  const { ability } = useAuth();
  const [openInvoiceModal, setOpenInvoiceModal] = useState();
  const [selectedInvoice, setSelectedInvoice] = useState();
  const [refreshTable, setRefreshTable] = useState(0);

  const { data: invoice } = useEncounterInvoiceQuery(selectedInvoice?.encounterId);
  const { data: totalOutstandingBalance } = useInvoiceTotalOutstandingBalanceQuery(patient?.id);

  const afterDeleteInvoice = useCallback(() => setRefreshTable(prev => prev + 1), []);

  useEffect(() => {
    if (invoice) {
      setRefreshTable(prev => prev + 1);
    }
  }, [invoice]);

  return (
    <>
      <Table
        endpoint={`patient/${patient.id}/invoices`}
        columns={COLUMNS}
        noDataMessage={
          <TranslatedText stringId="patient.invoice.table.noData" fallback="No invoices found" />
        }
        allowExport={false}
        TableHeader={
          <TableTitle>
            <span>
              <TranslatedText stringId="patient.invoice.table.title" fallback="Patient invoices" />
            </span>
            <span>
              <TranslatedText
                stringId="patient.invoice.table.totalBalance"
                fallback="Total balance: $:totalBalance"
                replacements={{
                  totalBalance: formatDisplayPrice(totalOutstandingBalance?.result || 0),
                }}
              />
            </span>
          </TableTitle>
        }
        onClickRow={
          ability.can('read', 'Invoice')
            ? (_, data) => {
                setSelectedInvoice(data);
                setOpenInvoiceModal(INVOICE_MODAL_TYPES.EDIT_INVOICE);
              }
            : undefined
        }
        refreshCount={refreshTable}
      />
      {openInvoiceModal && (
        <InvoiceModalGroup
          initialModalType={openInvoiceModal}
          initialInvoice={invoice}
          onClose={() => setOpenInvoiceModal()}
          isPatientView
          afterDeleteInvoice={afterDeleteInvoice}
        />
      )}
    </>
  );
};
