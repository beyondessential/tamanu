import React from 'react';
import styled from 'styled-components';

import { AutocompleteField, DateDisplay, Field, Form, useSuggester } from '@tamanu/ui-components';
import { formatDisplayPrice } from '@tamanu/shared/utils/invoice';

import { TranslatedText } from '../../components/Translation';
import { ModalFormActionRow } from '../../components/ModalActionRow';
import { useRefundPatientPayment } from '../../api/mutations';
import { CASH_PAYMENT_METHOD_ID } from '../../constants';
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

export const PatientPaymentRefundModal = ({ invoice, isOpen, onClose, selectedPaymentRecord }) => {
  const paymentRecord = selectedPaymentRecord ?? {};
  const paymentMethodSuggester = useSuggester('paymentMethod');
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
      <Form
        enableReinitialize
        suppressErrorDialog
        onSubmit={handleSubmit}
        data-testid="form-xw5y"
        initialValues={{
          methodId: CASH_PAYMENT_METHOD_ID,
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
                    <TranslatedText stringId="invoice.modal.receiptNumber" fallback="Receipt no" />
                  </Label>
                  <AmountLabel>
                    <TranslatedText stringId="invoice.modal.refundAmount" fallback="Refund amount:" />
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
                    <TranslatedText stringId="invoice.modal.refundAmount" fallback="Refund amount:" />{' '}
                    {formatDisplayPrice(paymentRecord.amount)}
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
      />
    </StyledModal>
  );
};
