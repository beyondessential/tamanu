import React from 'react';
import * as yup from 'yup';
import { Box, Divider } from '@material-ui/core';
import styled from 'styled-components';
import { Modal } from '../../Modal';
import { TranslatedText } from '../../Translation';
import { InvoiceItemCard } from './InvoiceItemCard';
import { Colors, INVOICE_ITEM_ACTION_MODAL_TYPES } from '../../../constants';
import { Field, Form, NumberField, SelectField, TextField } from '../../Field';
import { FormGrid } from '../../FormGrid';
import { useTranslation } from '../../../contexts/Translation';
import { ConfirmCancelRowField } from '../../VaccineCommonFields';
import { INVOICE_ITEMS_DISCOUNT_TYPES } from '@tamanu/constants';
import { useFormikContext } from 'formik';
import { getInvoiceItemPriceDisplay } from '@tamanu/shared/utils/invoice';

const StyledDivider = styled(Divider)`
  margin: 26px -32px 32px -32px;
`;

const discountTypeOptions = [
  { value: INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE, label: '%' },
  { value: INVOICE_ITEMS_DISCOUNT_TYPES.AMOUNT, label: '$' },
];

const preventInvalid = event => {
  if (!event.target.validity.valid) {
    event.target.value = '';
  }
};

const validateDecimalPlaces = e => {
  const value = e.target.value;
  if (/^[−-]/.test(value)) {
    e.target.value = '';
    return;
  }
  if (value.includes('.')) {
    const decimalPlaces = value.split('.')[1].length;
    if (decimalPlaces > 2) {
      e.target.value = parseFloat(value).toFixed(2);
    }
  }
};

const DiscountForm = () => {
  const { values } = useFormikContext();
  const { getTranslation } = useTranslation();
  const type = values.type;

  return (
    <FormGrid columns={4}>
      <Field
        name="type"
        label={
          <TranslatedText
            stringId="invoice.modal.addDiscountInvoiceItem.discount.type"
            fallback="Type"
            data-testid='translatedtext-5vwi' />
        }
        component={SelectField}
        options={discountTypeOptions}
        required
        style={{ gridColumn: '1 / 1' }}
        data-testid='field-iotc' />
      <Field
        name="amount"
        label={
          <TranslatedText
            stringId="invoice.modal.addDiscountInvoiceItem.discount.amount"
            fallback="Discount amount"
            data-testid='translatedtext-q04d' />
        }
        placeholder={getTranslation(
          'invoice.modal.addDiscountInvoiceItem.discount.placeholder',
          'e.g 10',
        )}
        component={NumberField}
        required
        min={0}
        {...(type === INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE && {
          max: 100,
          onInput: preventInvalid,
        })}
        {...(type === INVOICE_ITEMS_DISCOUNT_TYPES.AMOUNT && {
          onInput: validateDecimalPlaces,
        })}
        style={{ gridColumn: '2 / 2' }}
        data-testid='field-zdys' />
      <Field
        name="reason"
        label={
          <TranslatedText
            stringId="invoice.modal.addDiscountInvoiceItem.discountReason.label"
            fallback="Reason for item discount"
            data-testid='translatedtext-n9t8' />
        }
        component={TextField}
        style={{ gridColumn: '3 / 5' }}
        data-testid='field-rt1b' />
    </FormGrid>
  );
};

const MarkupForm = () => {
  const { values } = useFormikContext();
  const { getTranslation } = useTranslation();
  const type = values.type;

  return (
    <FormGrid columns={4}>
      <Field
        name="type"
        label={
          <TranslatedText
            stringId="invoice.modal.addDiscountInvoiceItem.markup.type"
            fallback="Type"
            data-testid='translatedtext-tvot' />
        }
        component={SelectField}
        options={discountTypeOptions}
        required
        style={{ gridColumn: '1 / 1' }}
        data-testid='field-qd3v' />
      <Field
        name="amount"
        label={
          <TranslatedText
            stringId="invoice.modal.addMarkupInvoiceItem.markup.amount"
            fallback="Markup amount"
            data-testid='translatedtext-c8r0' />
        }
        placeholder={getTranslation(
          'invoice.modal.addMarkupInvoiceItem.markup.placeholder',
          'e.g 10',
        )}
        component={NumberField}
        required
        min={0}
        {...(type === INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE && {
          onInput: preventInvalid,
        })}
        {...(type === INVOICE_ITEMS_DISCOUNT_TYPES.AMOUNT && {
          onInput: validateDecimalPlaces,
        })}
        style={{ gridColumn: '2 / 2' }}
        data-testid='field-vu61' />
      <Field
        name="reason"
        label={
          <TranslatedText
            stringId="invoice.modal.addMarkupInvoiceItem.discountReason.label"
            fallback="Reason for item markup"
            data-testid='translatedtext-pyg2' />
        }
        component={TextField}
        style={{ gridColumn: '3 / 5' }}
        data-testid='field-yv1t' />
    </FormGrid>
  );
};

const AddNoteForm = () => {
  return (
    <FormGrid columns={3}>
      <Field
        name="note"
        label={<TranslatedText
          stringId="invoice.modal.addNote.note.label"
          fallback="Note"
          data-testid='translatedtext-3h2c' />}
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
              data-testid='translatedtext-kxdo' />
          </Box>
        }
        data-testid='field-hoqc' />
    </FormGrid>
  );
};

export const InvoiceItemActionModal = ({ open, onClose, onAction, item, action }) => {
  const invoicePrice = parseFloat(getInvoiceItemPriceDisplay(item) || 0);

  const discountValidationSchema = yup.object({
    type: yup
      .string()
      .required()
      .translatedLabel(
        <TranslatedText
          stringId="invoice.modal.addDiscountInvoiceItem.discount.type"
          fallback="Type"
          data-testid='translatedtext-ra79' />,
      ),
    amount: yup
      .number()
      .required()
      .moreThan(0)
      .when('type', {
        is: INVOICE_ITEMS_DISCOUNT_TYPES.PERCENTAGE,
        then: schema => schema.max(100),
        otherwise: schema =>
          schema.test(
            'is-valid-amount',
            'Discount amount must be less than invoice item price',
            value => value <= invoicePrice,
          ),
      })
      .translatedLabel(
        <TranslatedText
          stringId="invoice.modal.addDiscountInvoiceItem.discount.amount"
          fallback="Discount amount"
          data-testid='translatedtext-tvqd' />,
      ),
  });

  const markupValidationSchema = yup.object({
    type: yup
      .string()
      .required()
      .translatedLabel(
        <TranslatedText
          stringId="invoice.modal.addDiscountInvoiceItem.markup.type"
          fallback="Type"
          data-testid='translatedtext-dkdh' />,
      ),
    amount: yup
      .number()
      .required()
      .moreThan(0)
      .translatedLabel(
        <TranslatedText
          stringId="invoice.modal.addMarkupInvoiceItem.markup.amount"
          fallback="Markup amount"
          data-testid='translatedtext-pzy2' />,
      ),
  });

  const getModalTitle = () => {
    switch (action) {
      case INVOICE_ITEM_ACTION_MODAL_TYPES.DELETE:
        return (
          <TranslatedText
            stringId="invoice.modal.deleteInvoiceItem.title"
            fallback="Delete item"
            data-testid='translatedtext-6ely' />
        );
      case INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_DISCOUNT:
        return (
          <TranslatedText
            stringId="invoice.modal.addDiscountInvoiceItem.title"
            fallback="Add discount"
            data-testid='translatedtext-s9sh' />
        );
      case INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_MARKUP:
        return (
          <TranslatedText
            stringId="invoice.modal.addMarkupInvoiceItem.title"
            fallback="Add markup"
            data-testid='translatedtext-efof' />
        );
      case INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_NOTE:
        return (
          <TranslatedText
            stringId="invoice.modal.addNote.title"
            fallback="Add note"
            data-testid='translatedtext-ngwl' />
        );
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
