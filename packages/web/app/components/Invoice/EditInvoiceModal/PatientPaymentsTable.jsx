import React, { useCallback, useState } from 'react';
import styled from 'styled-components';
import { customAlphabet } from 'nanoid';
import CachedIcon from '@material-ui/icons/Cached';
import { Box } from '@material-ui/core';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { getPatientPaymentRemainingBalance } from '@tamanu/shared/utils/invoice';

import { TranslatedText } from '../../Translation';
import { DataFetchingTable } from '../../Table';
import { Colors, denseTableStyle } from '../../../constants';
import { AutocompleteField, DateField, Field, Form, NumberField, TextField } from '../../Field';
import { Button } from '../../Button';
import { Heading4 } from '../../Typography';
import { useApi, useSuggester } from '../../../api';
import { DateDisplay } from '../../DateDisplay';
import { useCreatePatientPayment } from '../../../api/mutations';
import { PencilIcon } from '../../../assets/icons/PencilIcon';
import { getPatientPaymentsValidationSchema } from '../../../validations';

const TableContainer = styled.div`
  padding-left: 16px;
  padding-right: 16px;
  background-color: ${Colors.white};
  border-radius: 4px;
  border: 1px solid ${Colors.outline};
`;

const IconButton = styled.div`
  cursor: pointer;
  color: ${Colors.primary};
  position: absolute;
  top: 6px;
  right: -30px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 5px;
  margin-top: 6px;
  margin-bottom: 6px;
`;

const Title = styled.div`
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid ${Colors.outline};
`;

export const PatientPaymentsTable = ({invoiceId, onDataFetched, remainingBalance, refreshCount}) => {
  const [editingPayment, setEditingPayment] = useState({});
  const editingPaymentId = editingPayment?.id;
  console.log('editingPayment', editingPayment);
  const paymentMethodSuggester = useSuggester('paymentMethod');

  const cellStyle =
    denseTableStyle.cell +
    `
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
      &.MuiTableCell-body {
        padding-right: 5px;
      }
    `;
  return (
    <Form
        enableReinitialize
        onSubmit={value => console.log('value', value)}
        render={({ submitForm, setFieldValue }) => {
          const COLUMNS = useMemo(
            () => [
              {
                key: 'date',
                title: <TranslatedText stringId="general.date.label" fallback="Date" />,
                sortable: false,
                accessor: ({ id, date }) =>
                  editingPaymentId === id ? (
                    <Field
                      name="date"
                      required
                      component={DateField}
                      saveDateAsString
                      size="small"
                      style={{ gridColumn: 'span 3' }}
                    />
                  ) : (
                    <DateDisplay date={date} />
                  ),
              },
              {
                key: 'methodName',
                title: (
                  <TranslatedText
                    stringId="invoice.table.payment.column.method"
                    fallback="Method"
                  />
                ),
                sortable: false,
                accessor: ({ id, methodName }) =>
                  editingPaymentId === id ? (
                    <Field
                      name="methodId"
                      required
                      component={AutocompleteField}
                      suggester={paymentMethodSuggester}
                      size="small"
                    />
                  ) : (
                    methodName
                  ),
              },
              {
                key: 'amount',
                title: (
                  <TranslatedText
                    stringId="invoice.table.payment.column.amount"
                    fallback="Amount"
                  />
                ),
                sortable: false,
                accessor: ({ id, amount }) =>
                  editingPaymentId === id ? (
                    <Field
                      name="amount"
                      required
                      component={NumberField}
                      size="small"
                      min={0}
                      style={{ gridColumn: 'span 2' }}
                    />
                  ) : (
                    parseFloat(amount).toFixed(2)
                  ),
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
                accessor: ({ id, receiptNumber }) =>
                  editingPaymentId === id ? (
                    <Box position="relative">
                      <Field
                        name="receiptNumber"
                        required
                        component={TextField}
                        size="small"
                        onChange={e => setFieldValue('receiptNumber', e.target.value)}
                      />
                      <IconButton
                        onClick={() => setFieldValue('receiptNumber', generateReceiptNumber())}
                      >
                        <CachedIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    receiptNumber
                  ),
              },
              {
                sortable: false,
                accessor: row =>
                  editingPaymentId === row?.id ? (
                    <Button size="small" onClick={submitForm}>
                      <TranslatedText
                        stringId="invoice.modal.payment.action.record"
                        fallback="Record"
                      />
                    </Button>
                  ) : (
                    <Box display="flex" justifyContent="flex-end">
                      <Box sx={{ cursor: 'pointer' }} onClick={() => setEditingPayment(row)}>
                        <PencilIcon />
                      </Box>
                    </Box>
                  ),
              },
            ],
            [editingPaymentId],
          );
          return (
            <FormRow>
              <DataFetchingTable
                endpoint={`invoices/${invoiceId}/patientPayments`}
                columns={COLUMNS}
                allowExport={false}
                headerColor={Colors.white}
                fetchOptions={{ page: undefined }}
                elevated={false}
                containerStyle={denseTableStyle.container}
                cellStyle={cellStyle}
                headStyle={denseTableStyle.head}
                statusCellStyle={denseTableStyle.statusCell}
                disablePagination
                refreshCount={refreshCount}
                onDataFetched={onDataFetched}
                rowIdKey="id"
                onClickRow={() => {}}
              />
            </FormRow>
          );
        }}
        //validationSchema={getPatientPaymentsValidationSchema(remainingBalance)}
        initialValues={{
          date: editingPayment.date,
          methodId: editingPayment.methodId,
          amount: editingPayment.amount,
          receiptNumber: editingPayment.receiptNumber,
        }}
      />
  );
};
