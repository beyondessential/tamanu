import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import Decimal from 'decimal.js';
import { customAlphabet } from 'nanoid';
import { FORM_TYPES } from '@tamanu/constants';
import {
  AutocompleteField,
  DateField,
  Field,
  Form,
  NumberField,
  useSuggester,
  useDateTime,
  TAMANU_COLORS,
  TextButton,
} from '@tamanu/ui-components';
import { formatDisplayPrice } from '@tamanu/shared/utils/invoice';
import { Modal } from '../../components/Modal';
import { TranslatedText } from '../../components/Translation';
import { ModalFormActionRow } from '../../components/ModalActionRow';
import { useCreatePatientPayment, useUpdatePatientPayment } from '../../api/mutations';
import { CASH_PAYMENT_METHOD_ID } from '../../constants';

const RECEIPT_NUMBER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
const RECEIPT_NUMBER_LENGTH = 8;
const DECIMAL_PLACES = 2;

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

  > div {
    display: grid;
    align-items: start;
    grid-template-columns: ${props =>
      props.$isEditMode ? '150px 1fr 150px' : '140px 1fr 120px 80px'};
    gap: 20px;
  }
`;

const FormFields = styled.div`
  .label-field {
    display: none;
  }
`;

const LabelRow = styled.div`
  border-bottom: 1px solid ${TAMANU_COLORS.outline};
  padding: 0 10px;
  margin: 0 -10px 10px;
`;

const Label = styled.div`
  padding-bottom: 8px;
  font-weight: 400;
  color: ${props => props.theme.palette.text.tertiary};
  font-size: 14px;
`;

const PayBalanceButton = styled(TextButton)`
  color: ${props => props.theme.palette.primary.main};
  font-size: 14px;
  text-transform: none;
  transition: all 0.1s;
  margin-top: 15px;

  &:hover {
    text-decoration: underline;
  }
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

export const PatientPaymentModal = ({
  isOpen,
  onClose,
  invoice,
  patientPaymentRemainingBalance,
  selectedPaymentRecord,
}) => {
  const { getCurrentDate } = useDateTime();
  const paymentRecord = selectedPaymentRecord ?? {};

  const isEditMode = !!paymentRecord.id;
  const validationSchema = getValidationSchema(paymentRecord, patientPaymentRemainingBalance);

  const paymentMethodSuggester = useSuggester('paymentMethod');
  const { mutate: createPatientPayment } = useCreatePatientPayment(invoice);
  const { mutate: updatePatientPayment } = useUpdatePatientPayment(invoice, paymentRecord.id);

  const handleSubmit = data => {
    const formattedAmount = new Decimal(data.amount).toDecimalPlaces(DECIMAL_PLACES).toString();

    const paymentData = {
      ...data,
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
        isEditMode ? (
          <TranslatedText stringId="invoice.modal.editPayment.title" fallback="Edit payment" />
        ) : (
          <TranslatedText stringId="invoice.modal.recordPayment.title" fallback="Record payment" />
        )
      }
      open={isOpen}
      onClose={onClose}
      data-testid="modal-j1bi"
    >
      <Form
        enableReinitialize
        suppressErrorDialog
        onSubmit={handleSubmit}
        validationSchema={validationSchema}
        initialValues={{
          date: paymentRecord.date || getCurrentDate(),
          methodId: paymentRecord.patientPayment?.methodId || CASH_PAYMENT_METHOD_ID,
          amount: paymentRecord.amount != null ? paymentRecord.amount : '',
          receiptNumber: paymentRecord.receiptNumber,
        }}
        formType={isEditMode ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
        data-testid="form-gsr7"
        render={({ setFieldValue, values }) => {
          const amount = values.amount;

          const balance = calculateDisplayedBalance({
            patientPaymentRemainingBalance,
            amount,
            paymentRecord,
          });

          const isNegativeDisplayAmount = new Decimal(balance).isNegative();

          // Validates amount input to allow only numbers with up to 2 decimal places
          const handleInputAmount = event => {
            const next = event.target.value;
            if (next !== '' && !/^\d*\.?\d{0,2}$/.test(next)) {
              event.target.value = values.amount || '';
            }
          };

          // Formats the amount to exactly 2 decimal places on blur
          const handleBlurAmount = () => {
            if (amount && !isNaN(amount)) {
              const formatted = new Decimal(amount).toFixed(DECIMAL_PLACES);
              setFieldValue('amount', formatted);
            }
          };

          // Sets the payment amount to the full remaining balance
          const handlePayBalance = () => {
            const fullBalance = isEditMode
              ? new Decimal(patientPaymentRemainingBalance).plus(paymentRecord.amount).toNumber()
              : patientPaymentRemainingBalance;

            setFieldValue('amount', String(fullBalance));
          };

          return (
            <>
              <Header>
                <Text>
                  {isEditMode ? (
                    <TranslatedText
                      stringId="invoice.modal.editPayment.instruction"
                      fallback="Edit patient payment below."
                    />
                  ) : (
                    <TranslatedText
                      stringId="invoice.modal.recordPayment.instruction"
                      fallback="Record a patient payment below."
                    />
                  )}
                </Text>
                <Total>
                  <TranslatedText
                    stringId="invoice.modal.recordPayment.totalDue"
                    fallback="Patient total due:"
                  />{' '}
                  <span style={{ color: isNegativeDisplayAmount ? TAMANU_COLORS.alert : null }}>
                    {formatDisplayPrice(balance)}
                  </span>
                </Total>
              </Header>
              <FormCard $isEditMode={isEditMode}>
                <LabelRow>
                  <Label>
                    <TranslatedText stringId="general.date.label" fallback="Date" />
                  </Label>
                  <Label>
                    <TranslatedText stringId="general.date.method" fallback="Method" />
                  </Label>
                  <Label>
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
                  <Field
                    name="amount"
                    component={NumberField}
                    onInput={handleInputAmount}
                    onBlur={handleBlurAmount}
                    min={0}
                    data-testid="field-773f"
                  />
                  {!isEditMode && (
                    <PayBalanceButton onClick={handlePayBalance}>
                      <TranslatedText
                        stringId="invoice.modal.recordPayment.payBalance"
                        fallback="Pay balance"
                      />
                    </PayBalanceButton>
                  )}
                </FormFields>
              </FormCard>
              <ModalFormActionRow
                onCancel={onClose}
                confirmText={
                  isEditMode ? (
                    <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
                  ) : (
                    <TranslatedText
                      stringId="general.action.recordPayment"
                      fallback="Record payment"
                    />
                  )
                }
              />
            </>
          );
        }}
      />
    </StyledModal>
  );
};
