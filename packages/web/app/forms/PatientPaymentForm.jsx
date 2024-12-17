import React, { useState } from 'react';
import { customAlphabet } from 'nanoid';
import * as yup from 'yup';
import styled from 'styled-components';
import Decimal from 'decimal.js';
import { Box } from '@material-ui/core';
import CachedIcon from '@material-ui/icons/Cached';
import { round } from '@tamanu/shared/utils/invoice';
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
import { ThemedTooltip } from '../components/Tooltip';

const IconButton = styled.div`
  cursor: pointer;
  color: ${Colors.primary};
  position: absolute;
  top: 6px;
  right: -23px;
`;

const FormRow = styled.div`
  display: flex;
  margin-top: 6px;
  margin-bottom: 6px;
`;

const FieldContainer = styled(Box)`
  padding-right: 5px;
`;

export const PatientPaymentForm = ({
  patientPaymentRemainingBalance,
  editingPayment = {},
  updateRefreshCount,
  updateEditingPayment,
  onDataChange = () => {},
  invoice,
  showChequeNumberColumn,
}) => {
  const [openConfirmPaidModal, setOpenConfirmPaidModal] = useState(false);
  const paymentMethodSuggester = useSuggester('paymentMethod');
  const [amount, setAmount] = useState(editingPayment?.amount ?? '');

  const { mutate: createPatientPayment, isLoading: isCreatingPayment } = useCreatePatientPayment(
    invoice,
  );
  const { mutate: updatePatientPayment, isLoading: isUpdatingPayment } = useUpdatePatientPayment(
    invoice,
    editingPayment?.id,
  );

  const generateReceiptNumber = () => {
    return customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ123456789', 8)();
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
    const { amount, ...others } = data;
    if (!editingPayment?.id) {
      createPatientPayment(
        {
          ...others,
          amount: amount.toFixed(2),
        },
        {
          onSuccess: () => {
            updateRefreshCount();
            setAmount('');
            resetForm();
          },
        },
      );
    } else {
      updatePatientPayment(
        {
          ...others,
          amount,
        },
        {
          onSuccess: () => {
            updateRefreshCount();
            updateEditingPayment({});
          },
        },
      );
    }
  };

  const handleSubmit = (data, { resetForm }) => {
    const editingAmount = Number(editingPayment?.amount) ? Number(editingPayment.amount) : 0;
    const showConfirmModal =
      Number(data?.amount) >=
        round(new Decimal(patientPaymentRemainingBalance).add(editingAmount).toNumber(), 2) &&
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
      suppressErrorDialog
      onSubmit={handleSubmit}
      render={({ submitForm, setFieldValue }) => (
        <FormRow>
          <FieldContainer width="19%">
            <Field name="date" required component={DateField} saveDateAsString size="small" />
          </FieldContainer>
          <FieldContainer width="19%">
            <Field
              name="methodId"
              required
              component={AutocompleteField}
              suggester={paymentMethodSuggester}
              size="small"
              onChange={e => onDataChange({ paymentMethod: e.target })}
            />
          </FieldContainer>
          {showChequeNumberColumn && (
            <FieldContainer width="15%">
              <Field name="chequeNumber" component={TextField} size="small" />
            </FieldContainer>
          )}
          <FieldContainer width="13%">
            <Field
              name="amount"
              required
              component={NumberField}
              size="small"
              min={0}
              onInput={validateDecimalPlaces}
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </FieldContainer>
          <FieldContainer sx={{ width: '18%', position: 'relative', marginRight: '23px' }}>
            <Field
              name="receiptNumber"
              required
              component={TextField}
              size="small"
              onChange={e => setFieldValue('receiptNumber', e.target.value)}
            />
            <ThemedTooltip
              title={
                <TranslatedText
                  stringId="invoice.payment.tooltip.generateReceiptNumber"
                  fallback="Generate receipt number"
                />
              }
            >
              <IconButton onClick={() => setFieldValue('receiptNumber', generateReceiptNumber())}>
                <CachedIcon />
              </IconButton>
            </ThemedTooltip>
          </FieldContainer>
          <Box sx={{ marginLeft: 'auto' }}>
            <Button
              size="small"
              onClick={submitForm}
              disabled={isCreatingPayment || isUpdatingPayment}
            >
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
          .required(<TranslatedText stringId="general.required" fallback="Required" />),
        methodId: yup
          .string()
          .required(<TranslatedText stringId="general.required" fallback="Required" />),
        chequeNumber: yup.string().matches(/^[A-Za-z0-9]+$/, {
          message: (
            <TranslatedText
              stringId="invoice.payment.validation.invalidChequeNumber"
              fallback="Invalid cheque number - alphanumeric characters only"
            />
          ),
        }),
        amount: yup
          .string()
          .required(<TranslatedText stringId="general.required" fallback="Required" />)
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
              return (
                Number(value) <=
                round(new Decimal(patientPaymentRemainingBalance).add(editingAmount).toNumber(), 2)
              );
            },
          ),
        receiptNumber: yup
          .string()
          .required(<TranslatedText stringId="general.required" fallback="Required" />)
          .matches(/^[A-Za-z0-9]+$/, {
            message: (
              <TranslatedText
                stringId="invoice.payment.validation.invalidReceiptNumber"
                fallback="Invalid receipt number - alphanumeric characters only"
              />
            ),
          }),
      })}
      enableReinitialize
      initialValues={{
        date: editingPayment.date,
        methodId: editingPayment.patientPayment?.methodId,
        chequeNumber: editingPayment.patientPayment?.chequeNumber,
        amount: editingPayment.amount,
        receiptNumber: editingPayment.receiptNumber,
      }}
      formType={editingPayment?.DateField ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
    />
  );
};
