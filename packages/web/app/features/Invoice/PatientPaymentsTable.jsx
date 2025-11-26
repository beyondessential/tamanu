import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import Decimal from 'decimal.js';
import { Box, Divider } from '@material-ui/core';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { getInvoiceSummary, formatDisplayPrice, round } from '@tamanu/shared/utils/invoice';
import { TranslatedText } from '../../components/Translation';
import { Table } from '../../components/Table';
import { Colors, denseTableStyle, CHEQUE_PAYMENT_METHOD_ID } from '../../constants';
import { Heading4 } from '../../components/Typography';
import { DateDisplay } from '../../components/DateDisplay';
import { useAuth } from '../../contexts/Auth';
import { PatientPaymentForm } from '../../forms/PatientPaymentForm';
import { PencilIcon } from '../../assets/icons/PencilIcon';
import useOverflow from '../../hooks/useOverflow';
import { ThemedTooltip } from '../../components/Tooltip';

const TableContainer = styled.div`
  padding-left: 16px;
  padding-right: 16px;
  background-color: ${Colors.white};
  border-radius: 4px;
  border: 1px solid ${Colors.outline};
`;

const Title = styled.div`
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid ${Colors.outline};
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
  const patientPayments = invoice.payments
    .filter(payment => !!payment?.patientPayment)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const [refreshCount, setRefreshCount] = useState(0);
  const { patientPaymentRemainingBalance } = getInvoiceSummary(invoice);
  const [editingPayment, setEditingPayment] = useState({});

  const [selectedCreatePayment, setSelectedCreatePayment] = useState({});
  const [selectedEditPayment, setSelectedEditPayment] = useState({});

  const [showRowTooltip, setShowRowTooltip] = useState(false);

  const hasChequePaymentMethod = patientPayments.some(
    payment => !!payment.patientPayment?.chequeNumber,
  );
  const showChequeNumberColumn =
    [
      selectedCreatePayment?.paymentMethod?.value,
      selectedEditPayment?.paymentMethod?.value,
    ].includes(CHEQUE_PAYMENT_METHOD_ID) || hasChequePaymentMethod;

  const { ability } = useAuth();
  const canCreatePayment = ability.can('create', 'InvoicePayment');
  const canEditPayment = ability.can('write', 'InvoicePayment');

  const updateRefreshCount = useCallback(() => setRefreshCount(prev => prev + 1), []);
  const updateEditingPayment = useCallback(editingPayment => setEditingPayment(editingPayment), []);

  const hideRecordPaymentForm =
    round(new Decimal(patientPaymentRemainingBalance).toNumber(), 2) <= 0 ||
    invoice.status === INVOICE_STATUSES.CANCELLED;
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
      accessor: ({ amount }) => formatDisplayPrice(amount),
    },
    {
      key: 'receiptNumber',
      title: (
        <TranslatedText
          stringId="invoice.table.payment.column.receiptNumber"
          fallback="Receipt number"
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
        !hideRecordPaymentForm &&
        canEditPayment && (
          <Box display="flex" justifyContent="flex-end" data-testid="box-nleu">
            <Box
              sx={{ cursor: 'pointer' }}
              onClick={() => setEditingPayment(row)}
              data-testid="box-n25g"
            >
              <PencilIcon data-testid="pencilicon-c4w2" />
            </Box>
          </Box>
        ),
    },
  ];

  const sliceIndex = patientPayments.findIndex(payment => payment.id === editingPayment.id);

  const cellsWidthString = `
    &:nth-child(1) {
      width 19%;
    }
    &:nth-child(2) {
      width 19%;
    }
    &:nth-child(3) {
      width ${showChequeNumberColumn ? '15%' : '13%'};
    }
    &:nth-child(4) {
      width ${showChequeNumberColumn ? '18%' : '25%'};
    }
    ${showChequeNumberColumn ? `&:nth-child(5) { width 18%; }` : ''}

    &.MuiTableCell-root {
      padding: 12px 0;
    }

    &.MuiTableCell-body:last-child {
        padding-right: 5px;
    }
  `;

  const tableProps = {
    columns: COLUMNS,
    allowExport: false,
    headerColor: Colors.white,
    fetchOptions: { page: undefined },
    elevated: false,
    containerStyle: denseTableStyle.container,
    cellStyle: denseTableStyle.cell + cellsWidthString,
    headStyle: denseTableStyle.head + `.MuiTableCell-head {${cellsWidthString}}`,
    statusCellStyle: denseTableStyle.statusCell,
    disablePagination: true,
    refreshCount: refreshCount,
    noDataMessage: '',
    rowIdKey: 'id',
  };

  const onCreateDataChange = data => {
    setSelectedCreatePayment(data);
  };
  const onEditDataChange = data => {
    setSelectedEditPayment(data);
  };
  const getRowTooltip = ({ updatedByUser }) => getRowTooltipText(updatedByUser);

  return (
    <TableContainer data-testid="tablecontainer-g8kz">
      <Title data-testid="title-jb7x">
        <Heading4 sx={{ margin: '15px 0 15px 0' }} data-testid="heading4-rklc">
          <TranslatedText
            stringId="invoice.modal.payment.patientPayments"
            fallback="Patient payments"
            data-testid="translatedtext-ujwm"
          />
        </Heading4>
        <Heading4 sx={{ margin: '15px 0 15px 0' }} data-testid="heading4-0rcp">
          <TranslatedText
            stringId="invoice.modal.payment.remainingBalance"
            fallback="Remaining balance: :remainingBalance"
            replacements={{
              remainingBalance: formatDisplayPrice(Math.max(0, patientPaymentRemainingBalance)),
            }}
            data-testid="translatedtext-e38g"
          />
        </Heading4>
      </Title>
      <Table
        {...tableProps}
        data={editingPayment?.id ? patientPayments.slice(0, sliceIndex) : []}
        {...(showRowTooltip && { getRowTooltip })}
        data-testid="table-so8f"
      />
      {editingPayment?.id && (
        <>
          <PatientPaymentForm
            patientPaymentRemainingBalance={patientPaymentRemainingBalance}
            editingPayment={editingPayment}
            invoice={invoice}
            updateRefreshCount={updateRefreshCount}
            updateEditingPayment={updateEditingPayment}
            onDataChange={onEditDataChange}
            selectedPayment={selectedEditPayment}
            showChequeNumberColumn={showChequeNumberColumn}
            data-testid="patientpaymentform-cvbk"
          />
          <Divider data-testid="divider-uc00" />
        </>
      )}
      <Table
        {...tableProps}
        data={
          editingPayment?.id
            ? patientPayments.slice(sliceIndex + 1, patientPayments.length)
            : patientPayments
        }
        hideHeader
        {...(showRowTooltip && { getRowTooltip })}
        data-testid="table-no3s"
      />
      {!hideRecordPaymentForm && canCreatePayment && (
        <PatientPaymentForm
          invoice={invoice}
          patientPaymentRemainingBalance={patientPaymentRemainingBalance}
          updateRefreshCount={updateRefreshCount}
          updateEditingPayment={updateEditingPayment}
          onDataChange={onCreateDataChange}
          selectedPayment={selectedCreatePayment}
          showChequeNumberColumn={showChequeNumberColumn}
          data-testid="patientpaymentform-ib6a"
        />
      )}
    </TableContainer>
  );
};
