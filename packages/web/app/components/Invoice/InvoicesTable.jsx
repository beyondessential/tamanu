import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  INVOICE_PATIENT_PAYMENT_STATUSES_LABELS,
  INVOICE_INSURER_PAYMENT_STATUSES,
  INVOICE_INSURER_PAYMENT_STATUS_LABELS,
  INVOICE_STATUSES,
  ENCOUNTER_TYPE_LABELS,
  ENCOUNTER_TYPE_ABBREVIATION_LABELS,
} from '@tamanu/constants';

import { Colors, INVOICE_MODAL_TYPES } from '../../constants';
import { DataFetchingTable } from '../Table';
import { TranslatedEnum, TranslatedText } from '../Translation';
import { Typography } from '@material-ui/core';
import { ThemedTooltip } from '../Tooltip';
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
import { DateDisplay } from '@tamanu/ui-components';

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

const getDate = ({ date }) => <DateDisplay date={date} format="shortest" />;
const getInvoiceTotal = row => {
  const { patientTotal } = getInvoiceSummaryDisplay(row);
  return patientTotal === undefined ? (
    <TranslatedText
      stringId="general.fallback.notApplicable"
      fallback="N/A"
      casing="lower"
      data-testid="translatedtext-nc3a"
    />
  ) : (
    `$${patientTotal}`
  );
};
const getPaymentStatus = row => {
  if (row.status !== INVOICE_STATUSES.FINALISED) {
    return (
      <TranslatedText
        stringId="general.fallback.notApplicable"
        fallback="N/A"
        casing="lower"
        data-testid="translatedtext-wjgy"
      />
    );
  }
  return (
    <>
      <TranslatedEnum
        value={row.patientPaymentStatus}
        enumValues={INVOICE_PATIENT_PAYMENT_STATUSES_LABELS}
        data-testid="translatedenum-r2dz"
      />
      {/* The payment status refers to the patient contribution only UNLESS the insurer has rejected the payment,
      in which case the status is followed by a /Rejected */}
      {row.insurerPaymentStatus === INVOICE_INSURER_PAYMENT_STATUSES.REJECTED && (
        <>
          {'/'}
          <TranslatedEnum
            value={row.insurerPaymentStatus}
            enumValues={INVOICE_INSURER_PAYMENT_STATUS_LABELS}
            data-testid="translatedenum-qjeb"
          />
        </>
      )}
    </>
  );
};
const getEncounterType = row => {
  const { encounter } = row;
  const label = (
    <TranslatedEnum enumValues={ENCOUNTER_TYPE_LABELS} value={encounter.encounterType} />
  );

  return (
    <ThemedTooltip title={label} data-testid="themedtooltip-zxwp">
      <TranslatedEnum
        enumValues={ENCOUNTER_TYPE_ABBREVIATION_LABELS}
        value={encounter.encounterType}
      />
    </ThemedTooltip>
  );
};
const getStatus = ({ status }) => (
  <InvoiceStatus status={status} data-testid="invoicestatus-i1yc" />
);

const getRemainingBalance = row => {
  if (row.status !== INVOICE_STATUSES.FINALISED)
    return (
      <TranslatedText
        stringId="general.fallback.notApplicable"
        fallback="N/A"
        casing="lower"
        data-testid="translatedtext-xymo"
      />
    );
  const { patientPaymentRemainingBalance } = getInvoiceSummary(row);
  const remainingBalance = formatDisplayPrice(Math.max(0, patientPaymentRemainingBalance));
  return `$${remainingBalance}`;
};

const COLUMNS = [
  {
    key: 'date',
    title: (
      <TranslatedText
        stringId="patient.invoice.table.column.date"
        fallback="Date"
        data-testid="translatedtext-yrb7"
      />
    ),
    accessor: getDate,
  },
  {
    key: 'displayId',
    title: (
      <TranslatedText
        stringId="patient.invoice.table.column.displayId"
        fallback="Invoice number"
        data-testid="translatedtext-6bo2"
      />
    ),
  },
  {
    key: 'encounterType',
    title: (
      <TranslatedText
        stringId="patient.invoice.table.column.encounterType"
        fallback="Admission"
        data-testid="translatedtext-yrqs"
      />
    ),
    accessor: getEncounterType,
  },
  {
    key: 'patientTotal',
    title: (
      <TranslatedText
        stringId="patient.invoice.table.column.patientTotal"
        fallback="Patient total"
        data-testid="translatedtext-1brp"
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
        data-testid="translatedtext-90i7"
      />
    ),
    accessor: getPaymentStatus,
  },
  {
    key: 'balance',
    title: (
      <TranslatedText
        stringId="patient.invoice.table.column.balance"
        fallback="Balance"
        data-testid="translatedtext-krre"
      />
    ),
    accessor: getRemainingBalance,
  },
  {
    key: 'status',
    title: (
      <TranslatedText
        stringId="patient.invoice.table.column.status"
        fallback="Status"
        data-testid="translatedtext-a57d"
      />
    ),
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
          <TranslatedText
            stringId="patient.invoice.table.noData"
            fallback="No invoices found"
            data-testid="translatedtext-swy0"
          />
        }
        allowExport={false}
        TableHeader={
          <TableTitle data-testid="tabletitle-xw5v">
            <span>
              <TranslatedText
                stringId="patient.invoice.table.title"
                fallback="Patient invoices"
                data-testid="translatedtext-umfy"
              />
            </span>
            <span>
              <TranslatedText
                stringId="patient.invoice.table.totalBalance"
                fallback="Total balance: $:totalBalance"
                replacements={{
                  totalBalance: formatDisplayPrice(totalOutstandingBalance?.result || 0),
                }}
                data-testid="translatedtext-y63h"
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
        data-testid="table-ea81"
      />
      {openInvoiceModal && (
        <InvoiceModalGroup
          initialModalType={openInvoiceModal}
          initialInvoice={invoice}
          onClose={() => setOpenInvoiceModal()}
          isPatientView
          afterDeleteInvoice={afterDeleteInvoice}
          data-testid="invoicemodalgroup-6dca"
        />
      )}
    </>
  );
};
