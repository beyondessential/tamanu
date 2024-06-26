
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';
import { customAlphabet } from 'nanoid';
import * as yup from 'yup';

import CachedIcon from '@material-ui/icons/Cached';
import { Box } from '@material-ui/core';
import { TranslatedText } from '../../Translation';
import { Table } from '../../Table';
import { Colors, denseTableStyle } from '../../../constants';
import { DateField, Field, Form, NumberField, TextField } from '../../Field';
import { Button } from '../../Button';
import { Heading4 } from '../../Typography';

const patientPaymentsMock = [{
    date: '02/02/24',
    method: 'Cash',
    amount: '1.00',
    receiptNumber: '823792387'
}]

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
        key: 'method',
        title: <TranslatedText stringId="invoice.table.payment.column.method" fallback="Method" />,
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
];

export const PatientPaymentsTable = () => {
    const [receiptNumber, setReceiptNumber] = useState('');
    const [newPatientPayments, setNewPatientPayments] = useState([]);

    const patientPaymentsData = useMemo(() => [
        ...patientPaymentsMock,
        ...newPatientPayments,
    ], [newPatientPayments]);

    const generateReceiptNumber = () => {
        const receiptNumber = customAlphabet('123456789', 8)() + customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ', 2)();
        setReceiptNumber(receiptNumber);
    };

    const onRecord = (data) => {
        setNewPatientPayments(prevPatientPayments => [
            ...prevPatientPayments,
            { ...data, receiptNumber }
        ]);
    };
    return (
        <TableContainer>
            <Title>
                <Heading4 sx={{ margin: '15px 0 15px 0' }}>
                    <TranslatedText stringId="invoice.modal.payment.patientPayments" fallback="Patient payments" />
                </Heading4>
                <Heading4 sx={{ margin: '15px 0 15px 0' }}>
                    <TranslatedText
                        stringId="invoice.modal.payment.remainingBalance"
                        fallback="Remaining balance: :remainingBalance"
                        replacements={{ remainingBalance: '0.90' }}
                    />
                </Heading4>
            </Title>
            <Table
                columns={COLUMNS}
                data={patientPaymentsData}
                headerColor={Colors.white}
                page={null}
                elevated={false}
                containerStyle={denseTableStyle.container}
                cellStyle={denseTableStyle.cell + `
          &:nth-child(1) {
            width 20%;
          }
          &:nth-child(2) {
            width 20%;
          }
          &:nth-child(3) {
            width 15%;
          }
        `}
                headStyle={denseTableStyle.head}
                statusCellStyle={denseTableStyle.statusCell}
            />
            <Form
                onSubmit={onRecord}
                render={({ submitForm }) => (
                    <FormRow>
                        <Box sx={{ width: 'calc(20% - 5px)' }}>
                            <Field
                                name='date'
                                required
                                component={DateField}
                                saveDateAsString
                                size="small"
                                style={{ gridColumn: 'span 3' }}
                            />
                        </Box>
                        <Box sx={{ width: 'calc(20% - 5px)' }}>
                            <Field
                                name='method'
                                required
                                component={TextField}
                                size="small"
                            />
                        </Box>
                        <Box sx={{ width: 'calc(15% - 5px)' }}>
                            <Field
                                name='amount'
                                required
                                component={NumberField}
                                size="small"
                                min={0}
                                style={{ gridColumn: 'span 2' }}
                            />
                        </Box>
                        <Box sx={{ width: 'calc(20% - 5px)', position: 'relative' }}>
                            {/* TODO: make this a Select field */}
                            <Field
                                name='receiptNumber'
                                required
                                component={TextField}
                                size="small"
                                value={receiptNumber}
                                disabled
                            />
                            <IconButton onClick={generateReceiptNumber}>
                                <CachedIcon />
                            </IconButton>
                        </Box>
                        <Box sx={{ gridColumn: 'span 3', marginLeft: 'auto' }}>
                            <Button size='small' onClick={submitForm}>
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
                    method: yup
                        .string()
                        .required()
                        .translatedLabel(<TranslatedText stringId="invoice.table.payment.column.method" fallback="Method" />),
                    amount: yup
                        .string()
                        .required()
                        .translatedLabel(<TranslatedText stringId="invoice.table.payment.column.amount" fallback="Amount" />),
                    receiptNumber: yup
                        .string()
                        .required()
                        .translatedLabel(<TranslatedText stringId="invoice.table.payment.column.receiptNumber" fallback="Receipt number" />),
                })}
            />
        </TableContainer >
    );
};