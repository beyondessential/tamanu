import React from 'react';
import styled from 'styled-components';
import { capitalize } from 'lodash';
import { Box } from '@material-ui/core';
import { INVOICE_INSURER_PAYMENT_STATUSES } from '@tamanu/constants';
import { formatDisplayPrice, getInvoiceSummary } from '@tamanu/shared/utils/invoice';
import { TranslatedText } from '../../components/Translation';
import { Table } from '../../components/Table';
import { Colors, denseTableStyle } from '../../constants';
import { Heading4 } from '../../components/Typography';
import { DateDisplay } from '../../components/DateDisplay';

const TableContainer = styled.div`
  padding-left: 16px;
  padding-right: 16px;
  background-color: ${Colors.white};
  flex: 2;
  border-radius: 4px;
  border: 1px solid ${Colors.outline};
`;

const Title = styled.div`
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid ${Colors.outline};
`;

const getInsurerPaymentStatus = insurerPayment => {
  if (insurerPayment?.status === INVOICE_INSURER_PAYMENT_STATUSES.REJECTED) {
    return (
      <Box color={Colors.alert} data-testid="box-lbl5">
        {`${capitalize(insurerPayment?.status)}${
          insurerPayment?.reason ? ` (${insurerPayment?.reason})` : ''
        }`}
      </Box>
    );
  }
  return capitalize(insurerPayment?.status);
};

const COLUMNS = [
  {
    key: 'date',
    title: (
      <TranslatedText
        stringId="general.date.label"
        fallback="Date"
        data-testid="translatedtext-8nlv"
      />
    ),
    sortable: false,
    dontCallRowInput: true,
    accessor: ({ date }) => <DateDisplay date={date} data-testid="datedisplay-t3t2" />,
  },
  {
    key: 'insurerName',
    title: (
      <TranslatedText
        stringId="invoice.table.payment.column.payer"
        fallback="Payer"
        data-testid="translatedtext-320w"
      />
    ),
    sortable: false,
    dontCallRowInput: true,
    accessor: ({ insurerPayment }) => insurerPayment?.insurer?.name,
  },
  {
    key: 'amount',
    title: (
      <TranslatedText
        stringId="invoice.table.payment.column.amount"
        fallback="Amount"
        data-testid="translatedtext-jm3e"
      />
    ),
    sortable: false,
    dontCallRowInput: true,
    accessor: ({ amount }) => formatDisplayPrice(amount),
  },
  {
    key: 'receiptNumber',
    title: (
      <TranslatedText
        stringId="invoice.table.payment.column.receiptNumber"
        fallback="Receipt number"
        data-testid="translatedtext-kv4o"
      />
    ),
    sortable: false,
    dontCallRowInput: true,
  },
  {
    key: 'status',
    title: (
      <TranslatedText
        stringId="invoice.table.payment.column.status"
        fallback="Status"
        data-testid="translatedtext-0d8c"
      />
    ),
    sortable: false,
    dontCallRowInput: true,
    accessor: ({ insurerPayment }) => getInsurerPaymentStatus(insurerPayment),
  },
];

export const InsurerPaymentsTable = ({ invoice }) => {
  const { insurerPaymentRemainingBalance } = getInvoiceSummary(invoice);
  const insurerPayments = invoice.payments.filter(payment => !!payment?.insurerPayment?.id);

  return (
    <TableContainer data-testid="tablecontainer-x4t9">
      <Title data-testid="title-az1x">
        <Heading4 sx={{ margin: '15px 0 15px 0' }} data-testid="heading4-3aw9">
          <TranslatedText
            stringId="invoice.modal.payment.insurerPayments"
            fallback="Insurer payments"
            data-testid="translatedtext-24np"
          />
        </Heading4>
        <Heading4 sx={{ margin: '15px 0 15px 0' }} data-testid="heading4-pxok">
          <TranslatedText
            stringId="invoice.modal.payment.remainingBalance"
            fallback="Remaining balance: :remainingBalance"
            replacements={{
              remainingBalance: formatDisplayPrice(Math.max(0, insurerPaymentRemainingBalance)),
            }}
            data-testid="translatedtext-29kz"
          />
        </Heading4>
      </Title>
      <Table
        columns={COLUMNS}
        data={insurerPayments}
        headerColor={Colors.white}
        page={null}
        elevated={false}
        containerStyle={denseTableStyle.container}
        cellStyle={denseTableStyle.cell + '&.MuiTableCell-body { padding: 12px 30px 12px 0px }'}
        headStyle={denseTableStyle.head}
        statusCellStyle={denseTableStyle.statusCell}
        noDataMessage=""
        data-testid="table-8pp9"
      />
    </TableContainer>
  );
};
