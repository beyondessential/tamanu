import React from 'react';
import styled from 'styled-components';
import { getInvoiceSummary } from '@tamanu/shared/utils/invoice';
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

const COLUMNS = [
  {
    key: 'date',
    title: <TranslatedText stringId="general.date.label" fallback="Date" />,
    sortable: false,
    accessor: ({ date }) => <DateDisplay date={date} />,
  },
  {
    key: 'insurerName',
    title: <TranslatedText stringId="invoice.table.payment.column.payer" fallback="Payer" />,
    sortable: false,
    accessor: ({ insurerPayment }) => insurerPayment?.insurer?.name,
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
      />
    ),
    sortable: false,
  },
  {
    key: 'status',
    title: <TranslatedText stringId="invoice.table.payment.column.status" fallback="Status" />,
    sortable: false,
    accessor: ({ insurerPayment }) => insurerPayment?.status,
  },
];

export const InsurerPaymentsTable = ({ invoice }) => {
  const { insurerPaymentRemainingBalance } = getInvoiceSummary(invoice);
  const insurerPayment = invoice.payments.filter(payment => !!payment?.insurerPayment?.id);

  return (
    <TableContainer>
      <Title>
        <Heading4 sx={{ margin: '15px 0 15px 0' }}>
          <TranslatedText
            stringId="invoice.modal.payment.insurerPayments"
            fallback="Insurer payments"
          />
        </Heading4>
        <Heading4 sx={{ margin: '15px 0 15px 0' }}>
          <TranslatedText
            stringId="invoice.modal.payment.remainingBalance"
            fallback="Remaining balance: :remainingBalance"
            replacements={{
              remainingBalance:
                insurerPaymentRemainingBalance <= 0 ? 0 : insurerPaymentRemainingBalance,
            }}
          />
        </Heading4>
      </Title>
      <Table
        columns={COLUMNS}
        data={insurerPayment}
        headerColor={Colors.white}
        page={null}
        elevated={false}
        containerStyle={denseTableStyle.container}
        cellStyle={denseTableStyle.cell}
        headStyle={denseTableStyle.head}
        statusCellStyle={denseTableStyle.statusCell}
      />
    </TableContainer>
  );
};
