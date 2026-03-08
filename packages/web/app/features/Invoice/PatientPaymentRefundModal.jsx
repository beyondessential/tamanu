import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { AutocompleteField, DateDisplay, Field, Form, useSuggester } from '@tamanu/ui-components';
import { formatDisplayPrice } from '@tamanu/utils/invoice';

import { TranslatedText } from '../../components/Translation';
import { ModalFormActionRow } from '../../components/ModalActionRow';
import { useRefundPatientPayment } from '../../api/mutations';
import { useDefaultPaymentMethodId } from './useDefaultPaymentMethodId';
import {
  Header,
  Label,
  LabelRow,
  RefundFormCard,
  StyledModal,
  Text,
  Value,
} from './PatientPaymentStyledComponents';

const AmountLabel = styled(Label)`
  text-align: right;
`;

const AmountValue = styled(Value)`
  text-align: right;
`;

const RefundRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const RefundAmount = styled.div`
  text-align: right;
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.palette.text.primary};
`;

const RefundAmountValue = styled.span`
  margin-left: 20px;
`;

const validationSchema = yup.object().shape({
  methodId: yup
    .string()
    .required(<TranslatedText stringId="general.required" fallback="Required" />),
});

export const PatientPaymentRefundModal = ({ invoice, isOpen, onClose, selectedPaymentRecord }) => {
  const paymentRecord = selectedPaymentRecord ?? {};
  const paymentMethodSuggester = useSuggester('paymentMethod');
  const { defaultMethodId, loading: loadingDefaultMethod } = useDefaultPaymentMethodId(paymentMethodSuggester);
  const { mutate: refundPatientPayment } = useRefundPatientPayment(invoice, paymentRecord.id);

  const handleSubmit = data => {
    refundPatientPayment(data, { onSuccess: onClose });
  };

  return (
    <StyledModal
      title={
        <TranslatedText stringId="invoice.modal.refundPayment.title" fallback="Issue refund" />
      }
      open={isOpen}
      onClose={onClose}
      data-testid="modal-j1bi"
    >
      {loadingDefaultMethod ? null : <Form
        enableReinitialize
        suppressErrorDialog
        onSubmit={handleSubmit}
        validationSchema={validationSchema}
        data-testid="form-xw5y"
        initialValues={{
          methodId: defaultMethodId ?? '',
        }}
        render={() => {
          return (
            <>
              <Header>
                <Text>
                  <TranslatedText
                    stringId="invoice.modal.refundPayment.instruction"
                    fallback="Would you like to refund the below payment?"
                  />
                </Text>
              </Header>
              <RefundFormCard>
                <LabelRow>
                  <Label>
                    <TranslatedText stringId="invoice.modal.date" fallback="Date" />
                  </Label>
                  <Label>
                    <TranslatedText stringId="invoice.modal.method" fallback="Method" />
                  </Label>
                  <Label>
                    <TranslatedText stringId="invoice.modal.receiptNumber" fallback="Receipt no." />
                  </Label>
                  <AmountLabel>
                    <TranslatedText stringId="invoice.modal.amount" fallback="Amount" />
                  </AmountLabel>
                </LabelRow>
                <LabelRow>
                  <Value>
                    <DateDisplay date={paymentRecord.date} />
                  </Value>
                  <Value>{paymentRecord.patientPayment?.method?.name}</Value>
                  <Value>{paymentRecord.receiptNumber}</Value>
                  <AmountValue>{formatDisplayPrice(paymentRecord.amount)}</AmountValue>
                </LabelRow>

                <RefundRow>
                  <Field
                    name="methodId"
                    component={AutocompleteField}
                    suggester={paymentMethodSuggester}
                    data-testid="field-c2nv"
                    disabled // Cash is the only method for refunds
                  />
                  <RefundAmount>
                    <TranslatedText
                      stringId="invoice.modal.refundAmount"
                      fallback="Refund amount:"
                    />{' '}
                    <RefundAmountValue>
                      {formatDisplayPrice(paymentRecord.amount)}
                    </RefundAmountValue>
                  </RefundAmount>
                </RefundRow>
              </RefundFormCard>

              <ModalFormActionRow
                onCancel={onClose}
                confirmText={
                  <TranslatedText stringId="invoice.modal.issueRefund" fallback="Issue refund" />
                }
              />
            </>
          );
        }}
      />}
    </StyledModal>
  );
};
