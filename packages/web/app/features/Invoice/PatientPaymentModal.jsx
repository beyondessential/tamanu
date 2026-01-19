import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal } from '../../components/Modal';
import { TranslatedText } from '../../components/Translation';
import { ModalFormActionRow } from '../../components/ModalActionRow';
import { customAlphabet } from 'nanoid';
import * as yup from 'yup';
import Decimal from 'decimal.js';
import { Box } from '@material-ui/core';
import { round } from '@tamanu/shared/utils/invoice';
import { FORM_TYPES } from '@tamanu/constants';
import {
  AutocompleteField,
  DateField,
  Field,
  Form,
  NumberField,
  TextField,
  useSuggester,
} from '@tamanu/ui-components';
import { ConfirmPaidModal } from './InvoiceForm/ConfirmPaidModal';
import { useCreatePatientPayment, useUpdatePatientPayment } from '../../api/mutations';
import { CHEQUE_PAYMENT_METHOD_ID } from '../../constants';

const FormBody = styled.div`
  display: flex;
  margin-top: 16px;
  margin-bottom: 36px;
  gap: 20px;
`;

const getValidationSchema = (editingPayment, patientPaymentRemainingBalance) =>
  yup.object().shape({
    date: yup
      .string()
      .required(
        <TranslatedText
          stringId="general.required"
          fallback="Required"
          data-testid="translatedtext-l7v1"
        />,
      ),
    methodId: yup
      .string()
      .required(
        <TranslatedText
          stringId="general.required"
          fallback="Required"
          data-testid="translatedtext-zkrq"
        />,
      ),
    chequeNumber: yup.string().matches(/^[A-Za-z0-9]+$/, {
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
      .required(
        <TranslatedText
          stringId="general.required"
          fallback="Required"
          data-testid="translatedtext-pern"
        />,
      )
      .test(
        'is-valid-amount',
        <TranslatedText
          stringId="invoice.payment.validation.exceedAmount"
          fallback="Cannot be more than outstanding balance"
          data-testid="translatedtext-dzh7"
        />,
        function(value) {
          const editingAmount = Number(editingPayment?.amount) ? Number(editingPayment.amount) : 0;
          return (
            Number(value) <=
            round(new Decimal(patientPaymentRemainingBalance).add(editingAmount).toNumber(), 2)
          );
        },
      ),
  });

const CheckNumberField = ({ selectedPaymentMethodId, showChequeNumberColumn }) => {
  if (selectedPaymentMethodId === CHEQUE_PAYMENT_METHOD_ID) {
    return <Field name="chequeNumber" component={TextField} data-testid="field-xhya" />;
  }
  return showChequeNumberColumn ? <Box width="15%" data-testid="box-5e2q" /> : null;
};

const generateReceiptNumber = () => {
  return customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ123456789', 8)();
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
  const selectedPaymentMethodId = paymentRecord.paymentMethod?.value;
  const [openConfirmPaidModal, setOpenConfirmPaidModal] = useState(false);

  const paymentMethodSuggester = useSuggester('paymentMethod');

  const { mutate: createPatientPayment } = useCreatePatientPayment(invoice);
  const { mutate: updatePatientPayment } = useUpdatePatientPayment(invoice, paymentRecord.id);

  const validateDecimalPlaces = e => {
    const value = e.target.value;
    if (value.includes('.')) {
      const decimalPlaces = value.split('.')[1].length;
      if (decimalPlaces > 2) {
        e.target.value = parseFloat(value).toFixed(2);
      }
    }
  };

  const onRecord = data => {
    const { amount, ...others } = data;
    const chequeNumber =
      selectedPaymentMethodId === CHEQUE_PAYMENT_METHOD_ID ? data.chequeNumber : '';

    if (!paymentRecord.id) {
      const receiptNumber = generateReceiptNumber();

      createPatientPayment(
        {
          ...others,
          receiptNumber,
          chequeNumber,
          amount: amount.toFixed(2),
        },
        {
          onSuccess: () => {
            onClose();
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
            onClose();
          },
        },
      );
    }
  };

  const handleSubmit = data => {
    const editingAmount = Number(paymentRecord.amount) ? Number(paymentRecord.amount) : 0;
    const showConfirmModal =
      Number(data?.amount) >=
        round(new Decimal(patientPaymentRemainingBalance).add(editingAmount).toNumber(), 2) &&
      !openConfirmPaidModal;
    if (showConfirmModal) {
      setOpenConfirmPaidModal(true);
      return;
    }
    setOpenConfirmPaidModal(false);
    onRecord(data);
  };

  const validationSchema = getValidationSchema(paymentRecord, patientPaymentRemainingBalance);

  return (
    <Modal
      width="sm"
      title={
        <TranslatedText stringId="invoice.modal.recordPayment.title" fallback="Record payment" />
      }
      open={isOpen}
      onClose={onClose}
      data-testid="modal-j1bi"
    >
      <Form
        enableReinitialize
        suppressErrorDialog
        onSubmit={handleSubmit}
        render={({ submitForm }) => (
          <>
            <FormBody>
              <Field
                name="date"
                required
                component={DateField}
                saveDateAsString
                data-testid="field-cx1w"
                label={<TranslatedText stringId="general.date.label" fallback="Date" />}
              />
              <Field
                name="methodId"
                required
                component={AutocompleteField}
                suggester={paymentMethodSuggester}
                data-testid="field-c2nv"
                label={<TranslatedText stringId="general.date.method" fallback="Method" />}
              />
              <CheckNumberField
                selectedPaymentMethodId={selectedPaymentMethodId}
                showChequeNumberColumn={showChequeNumberColumn}
              />
              <Field
                name="amount"
                required
                component={NumberField}
                min={0}
                onInput={validateDecimalPlaces}
                data-testid="field-773f"
                label={<TranslatedText stringId="general.date.amount" fallback="Amount" />}
              />
            </FormBody>
            <ModalFormActionRow
              onCancel={onClose}
              confirmText={
                <TranslatedText stringId="general.action.recordPayment" fallback="Record payment" />
              }
              data-testid="modalactionrow-r8rf"
            />
            {openConfirmPaidModal && (
              <ConfirmPaidModal
                open
                onClose={() => setOpenConfirmPaidModal(false)}
                onConfirm={submitForm}
                data-testid="confirmpaidmodal-b7z6"
              />
            )}
          </>
        )}
        validationSchema={validationSchema}
        initialValues={{
          date: paymentRecord.date,
          methodId: paymentRecord.patientPayment?.methodId,
          chequeNumber: paymentRecord.patientPayment?.chequeNumber,
          amount: paymentRecord.amount,
          receiptNumber: paymentRecord.receiptNumber,
        }}
        formType={paymentRecord.DateField ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
        data-testid="form-gsr7"
      />
    </Modal>
  );
};
