import React, { useEffect, useState } from 'react';
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
import { Colors, FORM_TYPES, CHEQUE_PAYMENT_METHOD_ID } from '../constants';
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
  selectedPayment,
}) => {
  const selectedPaymentMethodId = selectedPayment?.paymentMethod?.value;
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

  useEffect(() => {
    if (editingPayment?.patientPayment?.methodId) {
      onDataChange({ paymentMethod: { value: editingPayment.patientPayment.methodId } });
    }
  }, [editingPayment]);

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
    const chequeNumber =
      selectedPaymentMethodId === CHEQUE_PAYMENT_METHOD_ID ? data.chequeNumber : '';
    if (!editingPayment?.id) {
      createPatientPayment(
        {
          ...others,
          chequeNumber,
          amount: amount.toFixed(2),
        },
        {
          onSuccess: () => {
            updateRefreshCount();
            setAmount('');
            resetForm();
            onDataChange({ paymentMethod: { value: '' } });
          },
        },
      );
    } else {
      updatePatientPayment(
        {
          ...others,
          chequeNumber,
          amount,
        },
        {
          onSuccess: () => {
            updateRefreshCount();
            updateEditingPayment({});
            onDataChange({ paymentMethod: { value: '' } });
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

  const renderChequeNumberField = () => {
    if (selectedPaymentMethodId === CHEQUE_PAYMENT_METHOD_ID) {
      return (
        <FieldContainer width="15%">
          <Field
            name="chequeNumber"
            component={TextField}
            size="small"
            data-testid='field-yaum' />
        </FieldContainer>
      );
    }
    return showChequeNumberColumn ? <Box width="15%" /> : null;
  };

  return (
    <Form
      enableReinitialize
      suppressErrorDialog
      onSubmit={handleSubmit}
      render={({ submitForm, setFieldValue }) => (
        <FormRow>
          <FieldContainer width="19%">
            <Field
              name="date"
              required
              component={DateField}
              saveDateAsString
              size="small"
              data-testid='field-ct2t' />
          </FieldContainer>
          <FieldContainer width="19%">
            <Field
              name="methodId"
              required
              component={AutocompleteField}
              suggester={paymentMethodSuggester}
              size="small"
              onChange={e => onDataChange({ paymentMethod: e.target })}
              data-testid='field-nk19' />
          </FieldContainer>
          {renderChequeNumberField()}
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
              data-testid='field-wdfu' />
          </FieldContainer>
          <FieldContainer sx={{ width: '18%', position: 'relative', marginRight: '23px' }}>
            <Field
              name="receiptNumber"
              required
              component={TextField}
              size="small"
              onChange={e => setFieldValue('receiptNumber', e.target.value)}
              data-testid='field-sx09' />
            <ThemedTooltip
              title={
                <TranslatedText
                  stringId="invoice.payment.tooltip.generateReceiptNumber"
                  fallback="Generate receipt number"
                  data-testid='translatedtext-msnl' />
              }
            >
              <IconButton
                onClick={() => setFieldValue('receiptNumber', generateReceiptNumber())}
                data-testid='iconbutton-alcb'>
                <CachedIcon />
              </IconButton>
            </ThemedTooltip>
          </FieldContainer>
          <Box sx={{ marginLeft: 'auto' }}>
            <Button
              size="small"
              onClick={submitForm}
              disabled={isCreatingPayment || isUpdatingPayment}
              data-testid='button-bats'>
              <TranslatedText
                stringId="invoice.modal.payment.action.record"
                fallback="Record"
                data-testid='translatedtext-feva' />
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
          .required(<TranslatedText
          stringId="general.required"
          fallback="Required"
          data-testid='translatedtext-b6y7' />),
        methodId: yup
          .string()
          .required(<TranslatedText
          stringId="general.required"
          fallback="Required"
          data-testid='translatedtext-97r7' />),
        chequeNumber: yup.string().matches(/^[A-Za-z0-9]+$/, {
          message: (
            <TranslatedText
              stringId="invoice.payment.validation.invalidChequeNumber"
              fallback="Invalid cheque number - alphanumeric characters only"
              data-testid='translatedtext-k5dc' />
          ),
        }),
        amount: yup
          .string()
          .required(<TranslatedText
          stringId="general.required"
          fallback="Required"
          data-testid='translatedtext-x8ky' />)
          .test(
            'is-valid-amount',
            <TranslatedText
              stringId="invoice.payment.validation.exceedAmount"
              fallback="Cannot be more than outstanding balance"
              data-testid='translatedtext-2yf6' />,
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
          .required(<TranslatedText
          stringId="general.required"
          fallback="Required"
          data-testid='translatedtext-1rnj' />)
          .matches(/^[A-Za-z0-9]+$/, {
            message: (
              <TranslatedText
                stringId="invoice.payment.validation.invalidReceiptNumber"
                fallback="Invalid receipt number - alphanumeric characters only"
                data-testid='translatedtext-ff1v' />
            ),
          }),
      })}
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
