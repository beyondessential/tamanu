import React from 'react';
import { Divider } from '@material-ui/core';
import styled from 'styled-components';
import { Modal } from '../Modal';
import { TranslatedText } from '../Translation';
import { InvoiceItemDetailsCard } from '../InvoiceItemDetailsCard';
import { INVOICE_ACTION_MODALS } from '../../constants';
import { Field, Form, TextField } from '../Field';
import { FormGrid } from '../FormGrid';
import { useTranslation } from '../../contexts/Translation';
import { ConfirmCancelRowField } from '../VaccineCommonFields';
import * as yup from 'yup';

const StyledDivider = styled(Divider)`
  margin: 26px -32px 32px -32px;
`;

const DiscountForm = () => {
  const { getTranslation } = useTranslation();

  return (
    <FormGrid columns={3}>
      <Field
        component={TextField}
        type="number"
        label={
          <TranslatedText
            stringId="invoice.modal.addDiscountInvoiceItem.discount.label"
            fallback="Discount (%)"
          />
        }
        placeholder={getTranslation(
          'invoice.modal.addDiscountInvoiceItem.discount.placeholder',
          'e.g 10',
        )}
        name="discount"
        required
        style={{ gridColumn: '1 / 1' }}
      />
      <Field
        name="reason"
        label={
          <TranslatedText
            stringId="invoice.modal.addDiscountInvoiceItem.discountReason.label"
            fallback="Reason for item discount"
          />
        }
        component={TextField}
        style={{ gridColumn: '2 / 4' }}
      />
    </FormGrid>
  );
};

const MarkupForm = () => {
  const { getTranslation } = useTranslation();

  return (
    <FormGrid columns={3}>
      <Field
        component={TextField}
        type="number"
        label={
          <TranslatedText
            stringId="invoice.modal.addMarkupInvoiceItem.markup.label"
            fallback="Markup (%)"
          />
        }
        placeholder={getTranslation(
          'invoice.modal.addMarkupInvoiceItem.markup.placeholder',
          'e.g 10',
        )}
        name="markup"
        required
        style={{ gridColumn: '1 / 1' }}
      />
      <Field
        name="reason"
        label={
          <TranslatedText
            stringId="invoice.modal.addMarkupInvoiceItem.discountReason.label"
            fallback="Reason for item markup"
          />
        }
        component={TextField}
        style={{ gridColumn: '2 / 4' }}
      />
    </FormGrid>
  );
};

export const ActionModal = React.memo(({ open, onClose, onAction, lineItems, action }) => {
  const { getTranslation } = useTranslation();

  const discountValidationSchema = yup.object({
    discount: yup
      .number()
      .required()
      .translatedLabel(
        <TranslatedText
          stringId="invoice.modal.addDiscountInvoiceItem.discount.label"
          fallback="Discount (%)"
        />,
      )
      .min(
        0,
        getTranslation('validation.rule.positiveDiscount', 'Discount must be greater than 0'),
      ),
  });

  const markupValidationSchema = yup.object({
    markup: yup
      .number()
      .required()
      .translatedLabel(
        <TranslatedText
          stringId="invoice.modal.addMarkupInvoiceItem.markup.label"
          fallback="Markup (%)"
        />,
      )
    .min(0, getTranslation('validation.rule.positiveMarkup', 'Markup must be greater than 0')),
  });

  const getModalTitle = () => {
    switch (action) {
      case INVOICE_ACTION_MODALS.DELETE:
        return (
          <TranslatedText stringId="invoice.modal.deleteInvoiceItem.title" fallback="Delete item" />
        );
      case INVOICE_ACTION_MODALS.ADD_DISCOUNT:
        return (
          <TranslatedText
            stringId="invoice.modal.addDiscountInvoiceItem.title"
            fallback="Add discount"
          />
        );
      case INVOICE_ACTION_MODALS.ADD_MARKUP:
        return (
          <TranslatedText
            stringId="invoice.modal.addMarkupInvoiceItem.title"
            fallback="Add markup"
          />
        );
      default:
        return '';
    }
  };

  const formData = {
    [INVOICE_ACTION_MODALS.ADD_DISCOUNT]: {
      form: <DiscountForm />,
      schema: discountValidationSchema,
    },
    [INVOICE_ACTION_MODALS.ADD_MARKUP]: {
      form: <MarkupForm />,
      schema: markupValidationSchema,
    },
  };

  const handleSubmit = async submitData => {
    onAction(submitData);
  };

  const renderForm = ({ submitForm }) => (
    <>
      {formData[action]?.form}
      <StyledDivider />
      <ConfirmCancelRowField onConfirm={submitForm} onCancel={onClose} />
    </>
  );

  return (
    <Modal width="sm" title={getModalTitle()} open={open} onClose={onClose}>
      <InvoiceItemDetailsCard lineItems={lineItems} />
      <Form
        initialValues={{}}
        validationSchema={formData[action]?.schema}
        onSubmit={handleSubmit}
        render={renderForm}
      ></Form>
    </Modal>
  );
});
