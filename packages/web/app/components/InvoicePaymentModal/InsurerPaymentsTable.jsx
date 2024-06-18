import React from 'react';
import styled from 'styled-components';
import { TranslatedText } from '../Translation';
import { Table } from '../Table';
import { Colors, denseTableStyle } from '../../constants';
import { Heading4 } from '../Typography';

const insurerPaymentsMock = [{
  date: '02/02/24',
  payer: 'NIB',
  amount: '8.00',
  receiptNumber: '823792387',
  status: 'Paid'
}]

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

const COLUMNS = [
  {
    key: 'date',
    title: <TranslatedText stringId="general.date.label" fallback="Date" />,
    sortable: false,
  },
  {
    key: 'payer',
    title: <TranslatedText stringId="invoice.table.payment.column.payer" fallback="Payer" />,
    sortable: false,
  },
  {
    key: 'amount',
    title: <TranslatedText stringId="invoice.table.payment.column.amount" fallback="Amount" />,
    sortable: false,
  },
  {
    key: 'receiptNumber',
    title: (
      <TranslatedText
        stringId="invoice.table.payment.column.receiptNumber"
        fallback="Receipt number"
      />),
    sortable: false,
  },
  {
    key: 'status',
    title: <TranslatedText stringId="invoice.table.payment.column.status" fallback="Status" />,
    sortable: false,
  },
];

export const InsurerPaymentsTable = ({

}) => {
  return (
    <TableContainer>
      <Title>
        <Heading4 sx={{ margin: '15px 0 15px 0' }}>
          <TranslatedText stringId="invoice.modal.payment.insurerPayments" fallback="Insurer payments" />
        </Heading4>
        <Heading4 sx={{ margin: '15px 0 15px 0' }}>
          <TranslatedText 
            stringId="invoice.modal.payment.remainingBalance"
            fallback="Remaining balance: :remainingBalance"
            replacements={{ remainingBalance: '0.00' }}
          />
        </Heading4>
      </Title>
      <Table
        columns={COLUMNS}
        data={insurerPaymentsMock}
        headerColor={Colors.white}
        page={null}
        elevated={false}
        containerStyle={denseTableStyle.container}
        cellStyle={denseTableStyle.cell + `
          &:nth-child(2) {
            width 30%;
          }
          &:nth-child(5) {
            width 25%;
          }
        `}
        headStyle={denseTableStyle.head}
        statusCellStyle={denseTableStyle.statusCell}
      />
    </TableContainer >
  );
};
