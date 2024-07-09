import React, { useState } from 'react';
import { customAlphabet } from 'nanoid';
import * as yup from 'yup';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import CachedIcon from '@material-ui/icons/Cached';
import {
  AutocompleteField,
  Button,
  DateField,
  Field,
  Form,
  NumberField,
  TextField,
  TranslatedText,
} from '../components';
import { useSuggester } from '../api';
import { Colors, FORM_TYPES } from '../constants';
import { useCreatePatientPayment, useUpdatePatientPayment } from '../api/mutations';
import { ConfirmPaidModal } from '../components/Invoice/EditInvoiceModal/ConfirmPaidModal';

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

export const PatientPaymentForm = ({
  patientPaymentRemainingBalance,
  editingPayment = {},
  updateRefreshCount,
  updateEditingPayment,
  invoice,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [openConfirmPaidModal, setOpenConfirmPaidModal] = useState(false);
  const paymentMethodSuggester = useSuggester('paymentMethod');

  const { mutate: createPatientPayment } = useCreatePatientPayment(invoice);
  const { mutate: updatePatientPayment } = useUpdatePatientPayment(invoice, editingPayment?.id);

  const generateReceiptNumber = () => {
    return customAlphabet('123456789', 8)() + customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ', 2)();
  };

  const validateDecimalPlaces = e => {
    const value = e.target.value;
    if (value.includes('.')) {
      const decimalPlaces = value.split('.')[1].length;
      if (decimalPlaces > 2) {
        e.target.value = parseFloat(value).toFixed(2);
      }
    }
  };

  const onRecord = (data, { resetForm }) => {
    setIsSaving(true);
    const { date, methodId, receiptNumber, amount } = data;
    if (!editingPayment?.id) {
      createPatientPayment(
        {
          date,
          methodId,
          receiptNumber,
          amount: amount.toFixed(2),
        },
        {
          onSuccess: () => {
            updateRefreshCount();
            resetForm();
          },
          onSettled: () => setIsSaving(false),
        },
      );
    } else {
      updatePatientPayment(
        {
          date,
          methodId,
          receiptNumber,
          amount,
        },
        {
          onSuccess: () => {
            updateRefreshCount();
            updateEditingPayment({});
          },
          onSettled: () => setIsSaving(false),
        },
      );
    }
  };

  const handleSubmit = (data, { resetForm }) => {
    const editingAmount = Number(editingPayment?.amount) ? Number(editingPayment.amount) : 0;
    const showConfirmModal =
      data?.amount >= Number(patientPaymentRemainingBalance) + editingAmount &&
      !openConfirmPaidModal;
    if (showConfirmModal) {
      setOpenConfirmPaidModal(true);
      return;
    }
    setOpenConfirmPaidModal(false);
    onRecord(data, { resetForm });
  };

  return (
    <Form
      onSubmit={handleSubmit}
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
              onInput={validateDecimalPlaces}
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
            <Button size="small" onClick={submitForm} disabled={isSaving}>
              <TranslatedText stringId="invoice.modal.payment.action.record" fallback="Record" />
            </Button>
          </Box>
          {openConfirmPaidModal && (
            <ConfirmPaidModal
              open
              onClose={() => setOpenConfirmPaidModal(false)}
              onConfirm={submitForm}
            />
          )}
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
              const editingAmount = Number(editingPayment?.amount)
                ? Number(editingPayment.amount)
                : 0;
              return Number(value) <= Number(patientPaymentRemainingBalance) + editingAmount;
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
      enableReinitialize
      initialValues={{
        date: editingPayment.date,
        methodId: editingPayment.patientPayment?.methodId,
        amount: editingPayment.amount,
        receiptNumber: editingPayment.receiptNumber,
      }}
      formType={editingPayment?.DateField ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
    />
  );
};
