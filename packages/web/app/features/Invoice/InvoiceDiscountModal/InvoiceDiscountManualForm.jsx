import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import { Form, ConfirmCancelBackRow, NumberField, TextField } from '@tamanu/ui-components';
import { Field, TranslatedText, BodyText } from '../../../components';

const StyledDivider = styled(Divider)`
  margin: 36px -32px 20px -32px;
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
`;

const validationSchema = yup.object().shape({
  percentage: yup
    .number()
    .required()
    .min(1)
    .max(100)
    .translatedLabel(
      <TranslatedText
        stringId="invoice.validation.discountPercentage.path"
        fallback="Discount (%)"
      />,
    ),
});

export const InvoiceDiscountManualForm = ({ onClose, onBack, handleUpdateDiscount }) => {
  const handleSubmit = async ({ percentage, reason }) => {
    const discount = {
      percentage: (percentage / 100).toFixed(2),
      reason,
      isManual: true,
    };
    await handleUpdateDiscount(discount);
  };

  return (
    <>
      <BodyText mb="16px" color="textSecondary">
        <TranslatedText
          stringId="invoice.modal.manualDiscount.description"
          fallback="Please set the patient discount below. This discount will be applied to all eligible items on the invoice."
        />
      </BodyText>
      <Form
        onSubmit={handleSubmit}
        render={({ submitForm }) => (
          <>
            <FieldRow>
              <Field
                name="percentage"
                label={
                  <TranslatedText
                    stringId="invoice.modal.manualDiscount.percentage.label"
                    fallback="Discount (%)"
                  />
                }
                component={NumberField}
                required
              />
              <Field
                name="reason"
                label={
                  <TranslatedText
                    stringId="invoice.modal.manualDiscount.reason.label"
                    fallback="Reason for manual discount"
                  />
                }
                component={TextField}
              />
            </FieldRow>
            <StyledDivider />
            <ConfirmCancelBackRow
              onConfirm={submitForm}
              onCancel={onClose}
              onBack={onBack}
            />
          </>
        )}
        validationSchema={validationSchema}
      />
    </>
  );
};
