import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { customAlphabet } from 'nanoid';
import * as yup from 'yup';
import CachedIcon from '@material-ui/icons/Cached';
import { Box } from '@material-ui/core';
import { INVOICE_STATUSES } from '@tamanu/constants';
import { getPatientPaymentRemainingBalance } from '@tamanu/shared/utils/invoice';

import { TranslatedText } from '../../Translation';
import { Table } from '../../Table';
import { Colors, denseTableStyle } from '../../../constants';
import { AutocompleteField, DateField, Field, Form, NumberField, TextField } from '../../Field';
import { Button } from '../../Button';
import { Heading4 } from '../../Typography';
import { DateDisplay } from '../../DateDisplay';
import { useCreatePatientPayment } from '../../../api/mutations';
import { useSuggester } from '../../../api';

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
];

export const PatientPaymentsTable = ({ invoice }) => {
  const patientPayments = invoice.payments.filter(payment => !!payment?.patientPayment);
  const [refreshCount, setRefreshCount] = useState(0);
  const [patientRemainingBalance, setPatientRemainingBalance] = useState(0);

  const { mutate: createPatientPayment } = useCreatePatientPayment(invoice);

  useEffect(() => {
    const patientRemainingBalance = getPatientPaymentRemainingBalance(invoice);
    setPatientRemainingBalance(patientRemainingBalance);
  }, [invoice]);

  const paymentMethodSuggester = useSuggester('paymentMethod');

  const generateReceiptNumber = () => {
    return customAlphabet('123456789', 8)() + customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ', 2)();
  };

  const onRecord = async (data, { resetForm }) => {
    const { date, methodId, receiptNumber, amount } = data;
    createPatientPayment(
      {
        date,
        methodId,
        receiptNumber,
        amount: amount.toFixed(2),
      },
      {
        onSuccess: () => {
          setRefreshCount(prev => prev + 1);
          resetForm();
        },
      },
    );
  };

  const hideRecordPaymentForm =
    patientRemainingBalance <= 0 || invoice.status === INVOICE_STATUSES.CANCELLED;

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
        data={patientPayments}
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
        noDataMessage={<Box paddingBottom="24px" />}
      />
      {!hideRecordPaymentForm && (
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
                  <TranslatedText
                    stringId="invoice.modal.payment.action.record"
                    fallback="Record"
                  />
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
                  return Number(value) <= patientRemainingBalance;
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
      )}
    </TableContainer>
  );
};
