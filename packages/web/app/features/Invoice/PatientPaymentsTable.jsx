import React, { useState } from 'react';
import styled from 'styled-components';
import Decimal from 'decimal.js';
import { Box } from '@material-ui/core';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { getInvoiceSummary, round } from '@tamanu/shared/utils/invoice';
import { TranslatedText } from '../../components/Translation';
import { Table } from '../../components/Table';
import { Colors, denseTableStyle } from '../../constants';
import { Heading4 } from '../../components/Typography';
import { DateDisplay } from '../../components/DateDisplay';
import { useAuth } from '../../contexts/Auth';
import useOverflow from '../../hooks/useOverflow';
import { ThemedTooltip } from '../../components/Tooltip';
import { PatientPaymentModal } from './PatientPaymentModal.jsx';
import { NoteModalActionBlocker } from '../../components/index.js';
import { Button } from '@tamanu/ui-components';
import { ThreeDotMenu } from '../../components/ThreeDotMenu.jsx';
import { Price } from './Price';

const TableContainer = styled.div`
  padding-left: 16px;
  padding-right: 16px;
  background-color: ${Colors.white};
  border-radius: 4px;
  border: 1px solid ${Colors.outline};

  table {
    table-layout: fixed;

    .MuiTableCell-root {
      padding: 12px 0;
    }

    th {
      &:nth-child(1) {
        width: 120px;
      }

      &:nth-child(2) {
        // intentionally empty to take up remaining space
      }

      &:nth-child(3) {
        width ${props => (props.showChequeNumberColumn ? '100px' : '100px')};
      }

      &:nth-child(4) {
        width ${props => (props.showChequeNumberColumn ? '120px' : '120px')};
      }

      &:nth-child(5) {
        width ${props => (props.showChequeNumberColumn ? '80px' : '80px')};
      }

      &:nth-child(6) {
        width: 30px;
      }
    }
  }
`;

const Title = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${Colors.outline};

  h4 {
    margin: 15px 0;
  }
`;

const TooltipContainer = styled.div`
  text-align: center;
`;

const ChequeNumberContainer = styled.div`
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ChequeNumberDisplay = ({ patientPayment, setShowRowTooltip }) => {
  const { chequeNumber } = patientPayment;
  const [ref, isOverflowing] = useOverflow();

  const renderChequeNumber = () => (
    <ChequeNumberContainer
      onMouseEnter={() => setShowRowTooltip(false)}
      onMouseLeave={() => setShowRowTooltip(true)}
      ref={ref}
      data-testid="chequenumbercontainer-grfe"
    >
      {chequeNumber}
    </ChequeNumberContainer>
  );

  if (!isOverflowing) {
    return renderChequeNumber();
  }
  return (
    <ThemedTooltip title={chequeNumber} data-testid="themedtooltip-frvt">
      {renderChequeNumber()}
    </ThemedTooltip>
  );
};

const getRowTooltipText = updatedByUser =>
  updatedByUser?.displayName ? (
    <TooltipContainer data-testid="tooltipcontainer-kw8l">
      <TranslatedText
        stringId="invoice.table.tooltip.recordedBy"
        fallback="Recorded by"
        data-testid="translatedtext-qvgm"
      />
      <div>{updatedByUser.displayName}</div>
    </TooltipContainer>
  ) : null;

export const PatientPaymentsTable = ({ invoice }) => {
  const [paymentModalIsOpen, setPaymentModalIsOpen] = useState(false);
  const [selectedPaymentRecord, setSelectedPaymentRecord] = useState(null);
  const [showRowTooltip, setShowRowTooltip] = useState(false);

  const patientPayments = invoice.payments
    .filter(payment => !!payment?.patientPayment)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const { patientPaymentRemainingBalance } = getInvoiceSummary(invoice);

  const showChequeNumberColumn = patientPayments.some(
    payment => !!payment.patientPayment?.chequeNumber,
  );

  const { ability } = useAuth();
  const canCreatePayment = ability.can('create', 'InvoicePayment');
  const canEditPayment = ability.can('write', 'InvoicePayment');

  const hideRecordPaymentForm =
    round(new Decimal(patientPaymentRemainingBalance).toNumber(), 2) <= 0 ||
    invoice.status === INVOICE_STATUSES.CANCELLED;

  const onEditPaymentRecord = row => {
    setSelectedPaymentRecord(row);
    setPaymentModalIsOpen(true);
  };

  const onRecordPayment = () => {
    setSelectedPaymentRecord(null);
    setPaymentModalIsOpen(true);
  };

  const onClosePaymentModal = () => {
    setSelectedPaymentRecord(null);
    setPaymentModalIsOpen(false);
  };

  const COLUMNS = [
    {
      key: 'date',
      title: (
        <TranslatedText
          stringId="general.date.label"
          fallback="Date"
          data-testid="translatedtext-5qcp"
        />
      ),
      sortable: false,
      accessor: ({ date }) => <DateDisplay date={date} data-testid="datedisplay-21cc" />,
    },
    {
      key: 'methodName',
      title: (
        <TranslatedText
          stringId="invoice.table.payment.column.method"
          fallback="Method"
          data-testid="translatedtext-55c8"
        />
      ),
      sortable: false,
      accessor: ({ patientPayment }) => patientPayment?.method?.name,
    },
    ...(showChequeNumberColumn
      ? [
          {
            key: 'chequeNumber',
            title: (
              <TranslatedText
                stringId="invoice.table.payment.column.chequeNumber"
                fallback="Chq no."
                data-testid="translatedtext-50g8"
              />
            ),
            sortable: false,
            accessor: prop => (
              <ChequeNumberDisplay
                {...prop}
                setShowRowTooltip={setShowRowTooltip}
                data-testid="chequenumberdisplay-5mlh"
              />
            ),
          },
        ]
      : []),
    {
      key: 'amount',
      title: (
        <TranslatedText
          stringId="invoice.table.payment.column.amount"
          fallback="Amount"
          data-testid="translatedtext-9pxt"
        />
      ),
      sortable: false,
      accessor: ({ amount }) => <Price price={amount} />,
    },
    {
      key: 'receiptNumber',
      title: (
        <TranslatedText
          stringId="invoice.table.payment.column.receiptNo"
          fallback="Receipt no."
          data-testid="translatedtext-v87s"
        />
      ),
      sortable: false,
    },
    {
      key: 'status',
      title: <TranslatedText stringId="invoice.table.payment.column.status" fallback="Status" />,
      accessor: () => <TranslatedText stringId="invoice.paymentStatus.paid" fallback="Paid" />,
      sortable: false,
    },
    {
      key: '',
      sortable: false,
      accessor: row =>
        canEditPayment && (
          <>
            <NoteModalActionBlocker>
              <ThreeDotMenu
                items={[
                  {
                    label: <TranslatedText stringId="general.action.edit" fallback="Edit" />,
                    onClick: () => onEditPaymentRecord(row),
                  },
                ]}
                data-testid="invoice-payment-menu-c4w2"
              />
            </NoteModalActionBlocker>
          </>
        ),
    },
  ];

  const getRowTooltip = ({ updatedByUser }) => getRowTooltipText(updatedByUser);

  return (
    <>
      <TableContainer showChequeNumberColumn={showChequeNumberColumn}>
        <Title>
          <Heading4>
            <TranslatedText
              stringId="invoice.modal.payment.patientPayments"
              fallback="Patient payments"
            />
          </Heading4>
          {!hideRecordPaymentForm && (
            <NoteModalActionBlocker>
              <Button size="small" data-testid="button-dre1" onClick={onRecordPayment}>
                <TranslatedText
                  stringId="invoice.modal.payment.action.recordPayment"
                  fallback="Record payment"
                />
              </Button>
            </NoteModalActionBlocker>
          )}
        </Title>
        <Table
          columns={COLUMNS}
          allowExport={false}
          headerColor={Colors.white}
          fetchOptions={{ page: undefined }}
          elevated={false}
          containerStyle={denseTableStyle.container}
          cellStyle={denseTableStyle.cell}
          headStyle={denseTableStyle.head}
          statusCellStyle={denseTableStyle.statusCell}
          disablePagination={true}
          noDataMessage={'No patient payments to display'}
          rowIdKey={'id'}
          data={patientPayments}
          {...(showRowTooltip && { getRowTooltip })}
          data-testid="table-so8f"
        />
      </TableContainer>
      {canCreatePayment && (
        <PatientPaymentModal
          invoice={invoice}
          patientPaymentRemainingBalance={patientPaymentRemainingBalance}
          showChequeNumberColumn={showChequeNumberColumn}
          selectedPaymentRecord={selectedPaymentRecord}
          isOpen={paymentModalIsOpen}
          onClose={onClosePaymentModal}
        />
      )}
    </>
  );
};
