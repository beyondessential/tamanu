import React from 'react';
import styled from 'styled-components';
import { capitalize } from 'lodash';
import { Box } from '@material-ui/core';
import { INVOICE_INSURER_PAYMENT_STATUSES } from '@tamanu/constants';
import { formatDisplayPrice, getInvoiceSummary } from '@tamanu/shared/utils/invoice';
import { TranslatedText } from '../../Translation';
import { Table } from '../../Table';
import { Colors, denseTableStyle } from '../../../constants';
import { Heading4 } from '../../Typography';
import { DateDisplay } from '../../DateDisplay';

const TableContainer = styled.div`
  margin-top: 10px;
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
      <Box color={Colors.alert}>
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
    title: <TranslatedText
      stringId="general.date.label"
      fallback="Date"
      data-test-id='translatedtext-pmjc' />,
    sortable: false,
    dontCallRowInput: true,
    accessor: ({ date }) => <DateDisplay date={date} data-test-id='datedisplay-kde7' />,
  },
  {
    key: 'insurerName',
    title: <TranslatedText
      stringId="invoice.table.payment.column.payer"
      fallback="Payer"
      data-test-id='translatedtext-3zwh' />,
    sortable: false,
    dontCallRowInput: true,
    accessor: ({ insurerPayment }) => insurerPayment?.insurer?.name,
  },
  {
    key: 'amount',
    title: <TranslatedText
      stringId="invoice.table.payment.column.amount"
      fallback="Amount"
      data-test-id='translatedtext-0bsq' />,
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
        data-test-id='translatedtext-gc4v' />
    ),
    sortable: false,
    dontCallRowInput: true,
  },
  {
    key: 'status',
    title: <TranslatedText
      stringId="invoice.table.payment.column.status"
      fallback="Status"
      data-test-id='translatedtext-q2my' />,
    sortable: false,
    dontCallRowInput: true,
    accessor: ({ insurerPayment }) => getInsurerPaymentStatus(insurerPayment),
  },
];

export const InsurerPaymentsTable = ({ invoice }) => {
  const { insurerPaymentRemainingBalance } = getInvoiceSummary(invoice);
  const insurerPayments = invoice.payments.filter(payment => !!payment?.insurerPayment?.id);

  return (
    <TableContainer>
      <Title>
        <Heading4 sx={{ margin: '15px 0 15px 0' }}>
          <TranslatedText
            stringId="invoice.modal.payment.insurerPayments"
            fallback="Insurer payments"
            data-test-id='translatedtext-bt56' />
        </Heading4>
        <Heading4 sx={{ margin: '15px 0 15px 0' }}>
          <TranslatedText
            stringId="invoice.modal.payment.remainingBalance"
            fallback="Remaining balance: :remainingBalance"
            replacements={{
              remainingBalance: formatDisplayPrice(Math.max(0, insurerPaymentRemainingBalance)),
            }}
            data-test-id='translatedtext-36x1' />
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
      />
    </TableContainer>
  );
};
