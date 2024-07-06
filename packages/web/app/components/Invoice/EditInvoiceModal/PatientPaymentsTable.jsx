import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Box, Divider } from '@material-ui/core';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { getPatientPaymentRemainingBalance } from '@tamanu/shared/utils/invoice';

import { TranslatedText } from '../../Translation';
import { Table } from '../../Table';
import { Colors, denseTableStyle } from '../../../constants';
import { Heading4 } from '../../Typography';
import { DateDisplay } from '../../DateDisplay';
import { useAuth } from '../../../contexts/Auth';
import { PatientPaymentForm } from '../../../forms/PatientPaymentForm';
import { PencilIcon } from '../../../assets/icons/PencilIcon';

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

export const PatientPaymentsTable = ({ invoice }) => {
  const patientPayments = invoice.payments
    .filter(payment => !!payment?.patientPayment)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const [refreshCount, setRefreshCount] = useState(0);
  const [patientRemainingBalance, setPatientRemainingBalance] = useState(0);

  const [editingPayment, setEditingPayment] = useState({});

  const { ability } = useAuth();
  const canCreatePayment = ability.can('create', 'InvoicePayment');
  const canEditPayment = ability.can('write', 'InvoicePayment');

  const updateRefreshCount = useCallback(() => setRefreshCount(prev => prev + 1), []);
  const updateEditingPayment = useCallback(editingPayment => setEditingPayment(editingPayment), []);

  useEffect(() => {
    const patientRemainingBalance = getPatientPaymentRemainingBalance(invoice);
    setPatientRemainingBalance(patientRemainingBalance);
  }, [invoice]);

  const hideRecordPaymentForm =
    patientRemainingBalance <= 0 || invoice.status === INVOICE_STATUSES.CANCELLED;

  const COLUMNS = [
    {
      key: 'date',
      title: <TranslatedText stringId="general.date.label" fallback="Date" />,
      sortable: false,
      accessor: ({ date }) => <DateDisplay date={date} />,
    },
    {
      key: 'methodName',
      title: <TranslatedText stringId="invoice.table.payment.column.method" fallback="Method" />,
      sortable: false,
      accessor: ({ patientPayment }) => patientPayment?.method?.name,
    },
    {
      key: 'amount',
      title: <TranslatedText stringId="invoice.table.payment.column.amount" fallback="Amount" />,
      sortable: false,
      accessor: ({ amount }) => parseFloat(amount).toFixed(2),
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
      sortable: false,
      accessor: row =>
        !hideRecordPaymentForm &&
        canEditPayment && (
          <Box display="flex" justifyContent="flex-end">
            <Box sx={{ cursor: 'pointer' }} onClick={() => setEditingPayment(row)}>
              <PencilIcon />
            </Box>
          </Box>
        ),
    },
  ];

  const sliceIndex = patientPayments.findIndex(payment => payment.id === editingPayment.id);

  const cellsWidthString = `
    &:nth-child(1) {
      width 20%;
    }
    &:nth-child(2) {
      width 20%;
    }
    &:nth-child(3) {
      width 15%;
    }
    &:nth-child(4) {
      width 20%;
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
    noDataMessage: patientPayments.length ? '' : <Box paddingBottom="12px" />,
  };

  return (
    <TableContainer>
      <Title>
        <Heading4 sx={{ margin: '15px 0 15px 0' }}>
          <TranslatedText
            stringId="invoice.modal.payment.patientPayments"
            fallback="Patient payments"
          />
        </Heading4>
        <Heading4 sx={{ margin: '15px 0 15px 0' }}>
          <TranslatedText
            stringId="invoice.modal.payment.remainingBalance"
            fallback="Remaining balance: :remainingBalance"
            replacements={{ remainingBalance: patientRemainingBalance.toFixed(2) }}
          />
        </Heading4>
      </Title>
      <Table
        {...tableProps}
        data={editingPayment?.id ? patientPayments.slice(0, sliceIndex) : {}}
      />
      {editingPayment?.id && (
        <>
          <PatientPaymentForm
            patientRemainingBalance={patientRemainingBalance}
            editingPayment={editingPayment}
            invoice={invoice}
            updateRefreshCount={updateRefreshCount}
            updateEditingPayment={updateEditingPayment}
          />
          <Divider />
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
      />
      {!hideRecordPaymentForm && canCreatePayment && (
        <PatientPaymentForm
          invoice={invoice}
          patientRemainingBalance={patientRemainingBalance}
          updateRefreshCount={updateRefreshCount}
          updateEditingPayment={updateEditingPayment}
        />
      )}
    </TableContainer>
  );
};
