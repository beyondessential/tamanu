import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { customAlphabet } from 'nanoid';
import * as yup from 'yup';
import { getInvoiceSummaryDisplay } from '@tamanu/shared/utils/invoice';
import CachedIcon from '@material-ui/icons/Cached';
import { Box } from '@material-ui/core';
import { TranslatedText } from '../../Translation';
import { DataFetchingTable, Table } from '../../Table';
import { Colors, denseTableStyle } from '../../../constants';
import { AutocompleteField, DateField, Field, Form, NumberField, TextField } from '../../Field';
import { Button } from '../../Button';
import { Heading4 } from '../../Typography';
import { useApi, useSuggester } from '../../../api';
import { useCreatePatientPayments } from '../../../api/mutations';

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

const COLUMNS = [
  {
    key: 'date',
    title: <TranslatedText stringId="general.date.label" fallback="Date" />,
    sortable: false,
  },
  {
    key: 'methodName',
    title: <TranslatedText stringId="invoice.table.payment.column.method" fallback="Method" />,
    sortable: false,
    accessor: ({ methodName }) => methodName,
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
];

export const PatientPaymentsTable = ({ onDataFetched, remainingBalance, invoiceId }) => {
  const [refreshCount, setRefreshCount] = useState(0);

  const paymentMethodSuggester = useSuggester('paymentMethod');
  const api = useApi();

  const generateReceiptNumber = () => {
    return customAlphabet('123456789', 8)() + customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ', 2)();
  };

  const onRecord = async data => {
    await api.post(`invoices/${invoiceId}/patientPayments`, data);
    setRefreshCount(prev => prev + 1);
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
            replacements={{ remainingBalance: remainingBalance.toFixed(2) }}
          />
        </Heading4>
      </Title>
      <DataFetchingTable
        endpoint={`invoices/${invoiceId}/patientPayments`}
        columns={COLUMNS}
        allowExport={false}
        headerColor={Colors.white}
        fetchOptions={{ page: undefined }}
        elevated={false}
        containerStyle={denseTableStyle.container}
        cellStyle={
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
        `
        }
        headStyle={denseTableStyle.head}
        statusCellStyle={denseTableStyle.statusCell}
        disablePagination
        refreshCount={refreshCount}
        onDataFetched={onDataFetched}
      />
      <Form
        onSubmit={onRecord}
        render={({ submitForm, setFieldValue }) => (
          <FormRow>
            <Box sx={{ width: 'calc(20% - 5px)' }}>
              <Field
                name="date"
                required
                component={DateField}
                saveDateAsString
                size="small"
                style={{ gridColumn: 'span 3' }}
              />
            </Box>
            <Box sx={{ width: 'calc(20% - 5px)' }}>
              <Field
                name="methodId"
                required
                component={AutocompleteField}
                suggester={paymentMethodSuggester}
                size="small"
              />
            </Box>
            <Box sx={{ width: 'calc(15% - 5px)' }}>
              <Field
                name="amount"
                required
                component={NumberField}
                size="small"
                min={0}
                style={{ gridColumn: 'span 2' }}
              />
            </Box>
            <Box sx={{ width: 'calc(20% - 5px)', position: 'relative' }}>
              <Field
                name="receiptNumber"
                required
                component={TextField}
                size="small"
                onChange={e => setFieldValue('receiptNumber', e.target.value)}
              />
              <IconButton onClick={() => setFieldValue('receiptNumber', generateReceiptNumber())}>
                <CachedIcon />
              </IconButton>
            </Box>
            <Box sx={{ gridColumn: 'span 3', marginLeft: 'auto' }}>
              <Button size="small" onClick={submitForm}>
                <TranslatedText stringId="invoice.modal.payment.action.record" fallback="Record" />
              </Button>
            </Box>
          </FormRow>
        )}
        validationSchema={yup.object().shape({
          date: yup
            .string()
            .required()
            .translatedLabel(<TranslatedText stringId="general.date.label" fallback="date" />),
          methodId: yup
            .string()
            .required()
            .translatedLabel(
              <TranslatedText stringId="invoice.table.payment.column.method" fallback="Method" />,
            ),
          amount: yup
            .string()
            .required()
            .translatedLabel(
              <TranslatedText stringId="invoice.table.payment.column.amount" fallback="Amount" />,
            )
            .test(
              'is-valid-amount',
              <TranslatedText
                stringId="invoice.payment.validation.exceedAmount"
                fallback="Cannot be more than outstanding balance"
              />,
              function(value) {
                return value <= remainingBalance;
              },
            ),
          receiptNumber: yup
            .string()
            .required()
            .translatedLabel(
              <TranslatedText
                stringId="invoice.table.payment.column.receiptNumber"
                fallback="Receipt number"
              />,
            ),
        })}
      />
    </TableContainer>
  );
};
