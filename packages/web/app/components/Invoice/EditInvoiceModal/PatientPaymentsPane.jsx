import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { customAlphabet } from 'nanoid';
import CachedIcon from '@material-ui/icons/Cached';
import { Box } from '@material-ui/core';
import { TranslatedText } from '../../Translation';
import { DataFetchingTable } from '../../Table';
import { Colors, denseTableStyle } from '../../../constants';
import { AutocompleteField, DateField, Field, Form, NumberField, TextField } from '../../Field';
import { Button } from '../../Button';
import { Heading4 } from '../../Typography';
import { useApi, useSuggester } from '../../../api';
import { DateDisplay } from '../../DateDisplay';
import { PencilIcon } from '../../../assets/icons/PencilIcon';
import { getPatientPaymentsValidationSchema } from '../../../validations';
import { PatientPaymentsTable } from './PatientPaymentsTable';

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

export const PatientPaymentsPane = ({ onDataFetched, remainingBalance, invoiceId }) => {
  const paymentMethodSuggester = useSuggester('paymentMethod');
  const api = useApi();

  const generateReceiptNumber = () => {
    return customAlphabet('123456789', 8)() + customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ', 2)();
  };

  const onCreateRecord = async (data, { resetForm }) => {
    await api.post(`invoices/${invoiceId}/patientPayments`, data);
    setRefreshCount(prev => prev + 1);
    resetForm();
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
      <PatientPaymentsTable
        invoiceId={invoiceId}
        onDataFetched={onDataFetched}
        remainingBalance={remainingBalance}
      />
      <Form
        onSubmit={onCreateRecord}
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
        validationSchema={getPatientPaymentsValidationSchema(remainingBalance)}
      />
    </TableContainer>
  );
};
