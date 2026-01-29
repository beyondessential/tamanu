import React, { useState } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import Decimal from 'decimal.js';
import { Box } from '@material-ui/core';
import { customAlphabet } from 'nanoid';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { FORM_TYPES } from '@tamanu/constants';
import {
  AutocompleteField,
  DateField,
  Field,
  Form,
  NumberField,
  TextField,
  useSuggester,
  TAMANU_COLORS,
  TextButton,
} from '@tamanu/ui-components';
import { formatDisplayPrice } from '@tamanu/shared/utils/invoice';
import { Modal } from '../../components/Modal';
import { TranslatedText } from '../../components/Translation';
import { ModalFormActionRow } from '../../components/ModalActionRow';
import { useCreatePatientPayment, useUpdatePatientPayment } from '../../api/mutations';
import { CHEQUE_PAYMENT_METHOD_ID } from '../../constants';

const RECEIPT_NUMBER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
const RECEIPT_NUMBER_LENGTH = 8;
const DECIMAL_PLACES = 2;
const ALPHANUMERIC_PATTERN = /^[A-Za-z0-9]+$/;

const StyledModal = styled(Modal)`
  .MuiPaper-root {
    max-width: 680px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  margin-bottom: 16px;
  gap: 20px;
`;

const Text = styled.div`
  color: ${props => props.theme.palette.text.primary};
  font-size: 14px;
  font-weight: 400;
`;

const Total = styled.div`
  color: ${props => props.theme.palette.text.primary};
  font-size: 16px;
  font-weight: 500;
`;

const FormCard = styled.div`
  margin-bottom: 36px;
  background-color: ${TAMANU_COLORS.white};
  border: 1px solid ${TAMANU_COLORS.outline};
  border-radius: 5px;
  padding: 16px 20px;
`;

const FormFields = styled.div`
  display: grid;
  grid-template-columns: 150px 1fr 1fr 100px;
  gap: 20px;

  .label-field {
    display: none;
  }
`;

const LabelRow = styled.div`
  display: grid;
  grid-template-columns: 150px 1fr 1fr 100px;
  gap: 20px;
  border-bottom: 1px solid ${TAMANU_COLORS.outline};
  padding: 0 10px;
  margin: 0 -10px 10px;
`;

const Label = styled.div`
  padding-bottom: 8px;
  font-weight: 400;
  color: ${props => props.theme.palette.text.secondary};
`;

const PayBalanceButton = styled(TextButton)`
  font-size: 14px;
  text-transform: none;
`;

const generateReceiptNumber = () =>
  customAlphabet(RECEIPT_NUMBER_ALPHABET, RECEIPT_NUMBER_LENGTH)();

const calculateMaxAllowedAmount = (editingPayment, patientPaymentRemainingBalance) => {
  const editingAmount = editingPayment?.amount
    ? new Decimal(editingPayment.amount)
    : new Decimal(0);

  return new Decimal(patientPaymentRemainingBalance)
    .add(editingAmount)
    .toDecimalPlaces(DECIMAL_PLACES);
};

const getValidationSchema = (editingPayment, patientPaymentRemainingBalance) =>
  yup.object().shape({
    date: yup.string().required(<TranslatedText stringId="general.required" fallback="Required" />),
    methodId: yup
      .string()
      .required(<TranslatedText stringId="general.required" fallback="Required" />),
    chequeNumber: yup.string().matches(ALPHANUMERIC_PATTERN, {
      message: (
        <TranslatedText
          stringId="invoice.payment.validation.invalidChequeNumber"
          fallback="Invalid cheque number - alphanumeric characters only"
          data-testid="translatedtext-1as6"
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
          fallback="Amount cannot be above patient total due"
          data-testid="translatedtext-dzh7"
        />,
        function(value) {
          try {
            const inputAmount = new Decimal(value);
            const maxAllowed = calculateMaxAllowedAmount(
              editingPayment,
              patientPaymentRemainingBalance,
            );
            return inputAmount.lessThanOrEqualTo(maxAllowed);
          } catch {
            return false;
          }
        },
      ),
  });

// Calculates the patient's remaining balance after applying the payment amount
const calculateDisplayedBalance = ({
  patientPaymentRemainingBalance,
  amount,
  paymentRecord = {},
}) => {
  if (!amount) return patientPaymentRemainingBalance;

  const decimalRemaining = new Decimal(patientPaymentRemainingBalance);
  const isEditMode = !!paymentRecord.id;

  return isEditMode
    ? decimalRemaining
        .plus(paymentRecord.amount || 0)
        .minus(amount)
        .toNumber()
    : decimalRemaining.minus(amount).toNumber();
};

const CheckNumberField = ({ selectedPaymentMethodId, showChequeNumberColumn }) => {
  if (selectedPaymentMethodId === CHEQUE_PAYMENT_METHOD_ID) {
    return <Field name="chequeNumber" component={TextField} data-testid="field-xhya" />;
  }
  return showChequeNumberColumn ? <Box width="15%" data-testid="box-5e2q" /> : null;
};

export const PatientPaymentModal = ({
  isOpen,
  onClose,
  invoice,
  patientPaymentRemainingBalance,
  showChequeNumberColumn,
  selectedPaymentRecord,
}) => {
  const paymentRecord = selectedPaymentRecord ?? {};

  const [amount, setPaymentAmount] = useState(paymentRecord.amount);
  const isEditMode = !!paymentRecord.id;
  const validationSchema = getValidationSchema(paymentRecord, patientPaymentRemainingBalance);

  const balance = calculateDisplayedBalance({
    patientPaymentRemainingBalance,
    amount,
    paymentRecord,
  });

  const isNegativeDisplayAmount = new Decimal(balance).isNegative();

  const paymentMethodSuggester = useSuggester('paymentMethod');
  const { mutate: createPatientPayment } = useCreatePatientPayment(invoice);
  const { mutate: updatePatientPayment } = useUpdatePatientPayment(invoice, paymentRecord.id);

  // Validates amount input to allow only numbers with up to 2 decimal places
  const handleChangeAmount = event => {
    const next = event.target.value;

    if (/^\d*\.?\d{0,2}$/.test(next)) {
      setPaymentAmount(next);
    }
  };

  // Sets the payment amount to the full remaining balance
  const handlePayBalance = () => {
    const balance = isEditMode
      ? new Decimal(patientPaymentRemainingBalance).plus(paymentRecord.amount).toNumber()
      : patientPaymentRemainingBalance;
    setPaymentAmount(balance);
  };

  const handleSubmit = data => {
    const formattedAmount = new Decimal(data.amount).toDecimalPlaces(DECIMAL_PLACES).toString();
    const chequeNumber = data.methodId === CHEQUE_PAYMENT_METHOD_ID ? data.chequeNumber : null;

    const paymentData = {
      ...data,
      chequeNumber,
      amount: formattedAmount,
    };

    const mutation = isEditMode ? updatePatientPayment : createPatientPayment;
    const submitData = isEditMode
      ? paymentData
      : { ...paymentData, receiptNumber: generateReceiptNumber() };

    mutation(submitData, { onSuccess: onClose });
  };

  return (
    <StyledModal
      title={
        <TranslatedText stringId="invoice.modal.recordPayment.title" fallback="Record payment" />
      }
      open={isOpen}
      onClose={onClose}
      data-testid="modal-j1bi"
    >
      <Header>
        <Text>
          <TranslatedText
            stringId="invoice.modal.recordPayment.instruction"
            fallback="Record a patient payment below"
          />
        </Text>
        <Total>
          <TranslatedText
            stringId="invoice.modal.recordPayment.totalDue"
            fallback="Patient total due:"
          />{' '}
          <span style={{ color: isNegativeDisplayAmount ? TAMANU_COLORS.alert : 'initial' }}>
            {formatDisplayPrice(balance)}
          </span>
        </Total>
      </Header>
      <Form
        enableReinitialize
        suppressErrorDialog
        onSubmit={handleSubmit}
        validationSchema={validationSchema}
        initialValues={{
          date: paymentRecord.date || getCurrentDateTimeString(),
          methodId: paymentRecord.patientPayment?.methodId,
          chequeNumber: paymentRecord.patientPayment?.chequeNumber,
          amount: paymentRecord.amount,
          receiptNumber: paymentRecord.receiptNumber,
        }}
        formType={isEditMode ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
        data-testid="form-gsr7"
        render={({ values }) => (
          <>
            <FormCard>
              <LabelRow>
                <Label>
                  <TranslatedText stringId="general.date.label" fallback="Date" />
                </Label>
                <Label>
                  <TranslatedText stringId="general.date.method" fallback="Method" />
                </Label>
                <Label style={{ gridColumn: 'span 2' }}>
                  <TranslatedText stringId="general.date.amount" fallback="Amount" />
                </Label>
              </LabelRow>
              <FormFields>
                <Field
                  name="date"
                  component={DateField}
                  saveDateAsString
                  data-testid="field-cx1w"
                />
                <Field
                  name="methodId"
                  component={AutocompleteField}
                  suggester={paymentMethodSuggester}
                  data-testid="field-c2nv"
                />
                <CheckNumberField
                  selectedPaymentMethodId={values.methodId}
                  showChequeNumberColumn={showChequeNumberColumn}
                />
                <Field
                  name="amount"
                  component={NumberField}
                  onChange={handleChangeAmount}
                  value={amount}
                  min={0}
                  data-testid="field-773f"
                />
                <PayBalanceButton onClick={handlePayBalance}>
                  <TranslatedText
                    stringId="invoice.modal.recordPayment.payBalance"
                    fallback="Pay balance"
                  />
                </PayBalanceButton>
              </FormFields>
            </FormCard>
            <ModalFormActionRow
              onCancel={onClose}
              confirmText={
                <TranslatedText stringId="general.action.recordPayment" fallback="Record payment" />
              }
            />
          </>
        )}
      />
    </StyledModal>
  );
};
