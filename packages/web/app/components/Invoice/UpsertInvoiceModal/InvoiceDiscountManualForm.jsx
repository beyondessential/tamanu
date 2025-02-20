import React from 'react';
import * as yup from 'yup';
import styled from 'styled-components';
import { Divider } from '@material-ui/core';
import { FormGrid } from '../../FormGrid';
import { Field, Form, NumberField, TextField } from '../../Field';
import { TranslatedText } from '../../Translation';
import { BodyText, Heading3 } from '../../Typography';
import { FORM_TYPES } from '../../../constants';
import { ConfirmCancelBackRow } from '../../ButtonRow';

const StyledDivider = styled(Divider)`
  margin: 36px -32px 20px -32px;
`;

export const InvoiceDiscountManualForm = React.memo(
  ({ handleSubmit, onClose, handleBack, initialValues, isSubmitting }) => {
    const preventInvalid = (event) => {
      if (!event.target.validity.valid) {
        event.target.value = '';
      }
    };

    const onSubmit = (data) => {
      const percentage = data.percentage / 100;
      handleSubmit({ ...data, percentage });
    };

    return (
      <>
        <Heading3 mb="8px">
          <TranslatedText
            stringId="invoice.modal.manualDiscount.subtitle"
            fallback="Manual patient discount"
          />
        </Heading3>
        <BodyText mb="20px" color="textTertiary">
          <TranslatedText
            stringId="invoice.modal.manualDiscount.description"
            fallback="Please set the patient discount below. This discount will be applied to all eligible items on the invoice."
          />
        </BodyText>
        <Form
          onSubmit={onSubmit}
          render={({ submitForm }) => (
            <>
              <FormGrid columns={4}>
                <Field
                  name="percentage"
                  label={
                    <TranslatedText
                      stringId="invoice.modal.manualDiscount.discount.label"
                      fallback="Discount (%)"
                    />
                  }
                  component={NumberField}
                  min={0}
                  max={100}
                  onInput={preventInvalid}
                  required
                />
                <Field
                  name="reason"
                  label={
                    <TranslatedText
                      stringId="invoice.modal.addDiscount.reason.label"
                      fallback="Reason for manual discount"
                    />
                  }
                  component={TextField}
                  style={{ gridColumn: 'span 3' }}
                />
              </FormGrid>
              <StyledDivider />
              <ConfirmCancelBackRow
                onConfirm={submitForm}
                onCancel={onClose}
                onBack={handleBack}
                confirmText={<TranslatedText stringId="general.action.next" fallback="Next" />}
                confirmDisabled={isSubmitting}
              />
            </>
          )}
          initialValues={initialValues}
          validationSchema={yup.object().shape({
            reason: yup.string(),
            percentage: yup
              .number()
              .required()
              .translatedLabel(
                <TranslatedText
                  stringId="invoice.modal.manualDiscount.discount.label"
                  fallback="Discount (%)"
                />,
              ),
          })}
          formType={initialValues ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
        />
      </>
    );
  },
);
