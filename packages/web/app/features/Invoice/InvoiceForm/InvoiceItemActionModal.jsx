import React from 'react';
import * as yup from 'yup';
import { Box, Divider } from '@material-ui/core';
import styled from 'styled-components';
import { useFormikContext } from 'formik';
import { InvoiceItemCard } from './InvoiceItemCard';
import { INVOICE_ITEM_ACTION_MODAL_TYPES, Colors } from '../../../constants';
import { Field, NumberField } from '../../../components/Field';
import { useTranslation } from '../../../contexts/Translation';
import {
  TextField,
  SelectField,
  Form,
  FormGrid,
  Modal,
  TranslatedText,
  FormSubmitCancelRow,
} from '@tamanu/ui-components';
import { INVOICE_ITEMS_DISCOUNT_TYPES } from '@tamanu/constants';
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
    <FormGrid columns={4} data-testid="formgrid-nq1c">
      <Field
        name="type"
        label={
          <TranslatedText
            stringId="invoice.modal.addDiscountInvoiceItem.discount.type"
            fallback="Type"
            data-testid="translatedtext-povy"
          />
        }
        component={SelectField}
        options={discountTypeOptions}
        required
        style={{ gridColumn: '1 / 1' }}
        data-testid="field-x1us"
      />
      <Field
        name="amount"
        label={
          <TranslatedText
            stringId="invoice.modal.addDiscountInvoiceItem.discount.amount"
            fallback="Discount amount"
            data-testid="translatedtext-chc0"
          />
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
        data-testid="field-f1vf"
      />
      <Field
        name="reason"
        label={
          <TranslatedText
            stringId="invoice.modal.addDiscountInvoiceItem.discountReason.label"
            fallback="Reason for item discount"
            data-testid="translatedtext-uyma"
          />
        }
        component={TextField}
        style={{ gridColumn: '3 / 5' }}
        data-testid="field-5rde"
      />
    </FormGrid>
  );
};

const MarkupForm = () => {
  const { values } = useFormikContext();
  const { getTranslation } = useTranslation();
  const type = values.type;

  return (
    <FormGrid columns={4} data-testid="formgrid-ipzc">
      <Field
        name="type"
        label={
          <TranslatedText
            stringId="invoice.modal.addDiscountInvoiceItem.markup.type"
            fallback="Type"
            data-testid="translatedtext-titz"
          />
        }
        component={SelectField}
        options={discountTypeOptions}
        required
        style={{ gridColumn: '1 / 1' }}
        data-testid="field-q3my"
      />
      <Field
        name="amount"
        label={
          <TranslatedText
            stringId="invoice.modal.addMarkupInvoiceItem.markup.amount"
            fallback="Markup amount"
            data-testid="translatedtext-ftv4"
          />
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
        data-testid="field-jq24"
      />
      <Field
        name="reason"
        label={
          <TranslatedText
            stringId="invoice.modal.addMarkupInvoiceItem.discountReason.label"
            fallback="Reason for item markup"
            data-testid="translatedtext-iaw8"
          />
        }
        component={TextField}
        style={{ gridColumn: '3 / 5' }}
        data-testid="field-7e19"
      />
    </FormGrid>
  );
};

const AddNoteForm = () => {
  return (
    <FormGrid columns={3} data-testid="formgrid-f8vp">
      <Field
        name="note"
        label={
          <TranslatedText
            stringId="invoice.modal.addNote.note.label"
            fallback="Note"
            data-testid="translatedtext-lqlp"
          />
        }
        component={TextField}
        inputProps={{
          maxLength: 30,
        }}
        style={{ gridColumn: '1 / 3' }}
        helperText={
          <Box
            textAlign="right"
            fontSize="11px"
            fontWeight={400}
            color={Colors.midText}
            data-testid="box-xi3i"
          >
            <TranslatedText
              stringId="invoice.modal.addNote.note.helperText"
              fallback="Max 30 characters"
              data-testid="translatedtext-x4bm"
            />
          </Box>
        }
        data-testid="field-30xh"
      />
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
          data-testid="translatedtext-afd9"
        />,
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
            <TranslatedText
              stringId="invoice.validation.discountAmountTooHigh"
              fallback="Discount amount must be less than invoice item price"
            />,
            value => value <= invoicePrice,
          ),
      })
      .translatedLabel(
        <TranslatedText
          stringId="invoice.modal.addDiscountInvoiceItem.discount.amount"
          fallback="Discount amount"
          data-testid="translatedtext-9kqv"
        />,
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
          data-testid="translatedtext-a6g2"
        />,
      ),
    amount: yup
      .number()
      .required()
      .moreThan(0)
      .translatedLabel(
        <TranslatedText
          stringId="invoice.modal.addMarkupInvoiceItem.markup.amount"
          fallback="Markup amount"
          data-testid="translatedtext-4vgj"
        />,
      ),
  });

  const getModalTitle = () => {
    switch (action) {
      case INVOICE_ITEM_ACTION_MODAL_TYPES.DELETE:
        return (
          <TranslatedText
            stringId="invoice.modal.deleteInvoiceItem.title"
            fallback="Delete item"
            data-testid="translatedtext-87fm"
          />
        );
      case INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_DISCOUNT:
        return (
          <TranslatedText
            stringId="invoice.modal.addDiscountInvoiceItem.title"
            fallback="Add discount"
            data-testid="translatedtext-vfny"
          />
        );
      case INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_MARKUP:
        return (
          <TranslatedText
            stringId="invoice.modal.addMarkupInvoiceItem.title"
            fallback="Add markup"
            data-testid="translatedtext-dm58"
          />
        );
      case INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_NOTE:
        return (
          <TranslatedText
            stringId="invoice.modal.addNote.title"
            fallback="Add note"
            data-testid="translatedtext-2op8"
          />
        );
      default:
        return '';
    }
  };

  const formData = {
    [INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_DISCOUNT]: {
      form: <DiscountForm data-testid="discountform-zd85" />,
      schema: discountValidationSchema,
    },
    [INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_MARKUP]: {
      form: <MarkupForm data-testid="markupform-ia46" />,
      schema: markupValidationSchema,
    },
    [INVOICE_ITEM_ACTION_MODAL_TYPES.DELETE]: {
      description: (
        <TranslatedText
          stringId="invoice.modal.deleteInvoice.description"
          fallback="Are you sure you would like to delete the below item from the patient invoice?"
        />
      ),
      confirmText: (
        <TranslatedText
          stringId="invoice.modal.deleteInvoice.action.delete"
          fallback="Delete item"
        />
      ),
    },
    [INVOICE_ITEM_ACTION_MODAL_TYPES.ADD_NOTE]: {
      form: <AddNoteForm data-testid="addnoteform-ilq2" />,
      initialValues: { note: item.note },
      confirmText: item.note ? (
        <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
      ) : (
        <TranslatedText stringId="invoice.modal.editInvoice.addNote" fallback="Add note" />
      ),
    },
  };

  const handleSubmit = async submitData => {
    onAction(submitData);
  };

  const renderDescription = () => {
    const description = formData[action]?.description;
    return description ? (
      <Box mb={3} mt={3} pr={3}>
        {description}
      </Box>
    ) : null;
  };

  const renderForm = ({ submitForm }) => (
    <>
      {formData[action]?.form}
      <StyledDivider />
      <FormSubmitCancelRow
        onConfirm={submitForm}
        onCancel={onClose}
        confirmText={formData[action]?.confirmText}
      />
    </>
  );

  return (
    <Modal
      width="sm"
      title={getModalTitle()}
      open={open}
      onClose={onClose}
      data-testid="modal-bs2m"
    >
      {renderDescription()}
      <InvoiceItemCard item={item} data-testid="invoiceitemcard-74ar" />
      <Form
        validationSchema={formData[action]?.schema}
        initialValues={formData[action]?.initialValues}
        onSubmit={handleSubmit}
        render={renderForm}
        data-testid="form-ne4d"
      ></Form>
    </Modal>
  );
};
