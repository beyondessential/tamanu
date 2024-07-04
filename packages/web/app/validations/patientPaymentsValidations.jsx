import React from 'react';
import * as yup from 'yup';
import { TranslatedText } from '../components/Translation';

export const getPatientPaymentsValidationSchema = remainingBalance =>
  yup.object().shape({
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
  });
