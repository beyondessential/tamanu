import React, { useCallback } from 'react';
import * as yup from 'yup';
import { Modal } from './Modal';
import { FormGrid } from './FormGrid';
import { Field, Form, NumberField, TextField } from './Field';
import { TranslatedText } from './Translation';
import { FormSubmitCancelRow } from './ButtonRow';
import { BodyText, Heading3 } from './Typography';
import { useApi } from '../api';

export const InvoiceManualDiscountModal = React.memo(
  ({ open, onClose, invoiceId, priceChangeId, onUpdatePercentageChangeAndReason, description, percentageChange }) => {
    const api = useApi();
    const preventInvalid = value => {
      if (!value.target.validity.valid) {
        value.target.value = 0;
      }
    };

    const handleSubmit = useCallback(
      async data => {
        const percentageChange = -Math.abs(data.percentageChange / 100);
        await api.put(`invoices/${invoiceId}/priceChangeItems/${priceChangeId}`, {
          description: data.reason,
          percentageChange: percentageChange,
        });
        onUpdatePercentageChangeAndReason({ percentageChange, reason: data.reason });
        onClose();
      },
      [api, invoiceId, priceChangeId, onClose],
    );

    return (
      <Modal
        width="sm"
        title={<TranslatedText stringId="invoice.action.create" fallback="Create invoice" />}
        open={open}
        onClose={onClose}
      >
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
          onSubmit={handleSubmit}
          render={({ submitForm }) => (
            <FormGrid columns={4}>
              <Field
                name="percentageChange"
                label={<TranslatedText stringId="invoice.modal.manualDiscount.discount.label" fallback="Discount (%)" />}
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
                    fallback="Reason for item discount"
                  />
                }
                component={TextField}
                style={{ gridColumn: 'span 3' }}
              />
              <FormSubmitCancelRow
                onConfirm={submitForm}
                onCancel={onClose}
              />
            </FormGrid>
          )}
          initialValues={{
            percentageChange: Math.abs(percentageChange)*100,
            reason: description
          }}
          validationSchema={yup.object().shape({
            reason: yup.string(),
            percentageChange: yup
              .number()
              .required()
              .translatedLabel(
                <TranslatedText 
                  stringId="invoice.modal.manualDiscount.discount.label" 
                  fallback="Discount (%)" 
                />,
              ),
          })}
        />
      </Modal>
    );
  },
);
