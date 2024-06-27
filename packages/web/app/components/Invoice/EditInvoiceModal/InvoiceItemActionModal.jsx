import React from 'react';
import * as yup from 'yup';
import { Box, Divider } from '@material-ui/core';
import styled from 'styled-components';
import { Modal } from '../../Modal';
import { TranslatedText } from '../../Translation';
import { InvoiceItemCard } from './InvoiceItemCard';
import { Colors, INVOICE_ITEM_ACTION_MODAL_TYPES } from '../../../constants';
import { Field, Form, NumberField, TextField } from '../../Field';
import { FormGrid } from '../../FormGrid';
import { useTranslation } from '../../../contexts/Translation';
import { ConfirmCancelRowField } from '../../VaccineCommonFields';

const StyledDivider = styled(Divider)`
  margin: 26px -32px 32px -32px;
`;

const DiscountForm = () => {
  const { getTranslation } = useTranslation();

  const preventInvalid = event => {
    if (!event.target.validity.valid) {
      event.target.value = '';
    }
  };

  return (
    <FormGrid columns={3}>
      <Field
        name="percentage"
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
        component={NumberField}
        required
        min={0}
        max={100}
        onInput={preventInvalid}
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

  const preventInvalid = event => {
    if (!event.target.validity.valid) {
      event.target.value = '';
    }
  };

  return (
    <FormGrid columns={3}>
      <Field
        name="percentage"
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
        component={NumberField}
        required
        min={0}
        onInput={preventInvalid}
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

const AddNoteForm = () => {
  return (
    <FormGrid columns={3}>
      <Field
        name="note"
        label={<TranslatedText stringId="invoice.modal.addNote.note.label" fallback="Note" />}
        component={TextField}
        inputProps={{
          maxLength: 30,
        }}
        style={{ gridColumn: '1 / 3' }}
        helperText={
          <Box textAlign="right" fontSize="11px" fontWeight={400} color={Colors.midText}>
            <TranslatedText
              stringId="invoice.modal.addNote.note.helperText"
              fallback="Max 30 characters"
            />
          </Box>
        }
      />
    </FormGrid>
  );
};

const discountValidationSchema = yup.object({
  percentage: yup
    .number()
    .required()
    .moreThan(0)
    .max(100)
    .translatedLabel(
      <TranslatedText
        stringId="invoice.modal.addDiscountInvoiceItem.discount.label"
        fallback="Discount (%)"
      />,
    ),
});

const markupValidationSchema = yup.object({
  percentage: yup
    .number()
    .required()
    .moreThan(0)
    .translatedLabel(
      <TranslatedText
        stringId="invoice.modal.addMarkupInvoiceItem.markup.label"
        fallback="Markup (%)"
      />,
    ),
});

export const InvoiceItemActionModal = ({ open, onClose, onAction, item, action }) => {
  const getModalTitle = () => {
    switch (action) {
      case INVOICE_ITEM_ACTION_MODAL_TYPES.DELETE:
        return (
          <TranslatedText stringId="invoice.modal.deleteInvoiceItem.title" fallback="Delete item" />
        );
      case INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_DISCOUNT:
        return (
          <TranslatedText
            stringId="invoice.modal.addDiscountInvoiceItem.title"
            fallback="Add discount"
          />
        );
      case INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_MARKUP:
        return (
          <TranslatedText
            stringId="invoice.modal.addMarkupInvoiceItem.title"
            fallback="Add markup"
          />
        );
      case INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_NOTE:
        return <TranslatedText stringId="invoice.modal.addNote.title" fallback="Add note" />;
      default:
        return '';
    }
  };

  const formData = {
    [INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_DISCOUNT]: {
      form: <DiscountForm />,
      schema: discountValidationSchema,
    },
    [INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_MARKUP]: {
      form: <MarkupForm />,
      schema: markupValidationSchema,
    },
    [INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_NOTE]: {
      form: <AddNoteForm />,
      initialValues: { note: item.note },
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
      <InvoiceItemCard item={item} />
      <Form
        validationSchema={formData[action]?.schema}
        initialValues={formData[action]?.initialValues}
        onSubmit={handleSubmit}
        render={renderForm}
      ></Form>
    </Modal>
  );
};
