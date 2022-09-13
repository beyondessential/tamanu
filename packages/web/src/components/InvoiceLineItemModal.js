import React, { useCallback } from 'react';
import * as yup from 'yup';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';
import { useApi } from '../api';
import { Suggester } from '../utils/suggester';
import { foreignKey } from '../utils/validation';
import { Modal } from './Modal';
import { Form, Field, DateField, AutocompleteField, NumberField } from './Field';
import { FormGrid } from './FormGrid';
import { ConfirmCancelRow } from './ButtonRow';

export const InvoiceLineItemModal = ({
  title,
  actionText,
  open,
  onClose,
  onSaved,
  invoiceId,
  invoiceLineItem,
}) => {
  const api = useApi();
  const invoiceLineTypeSuggester = new Suggester(api, 'invoiceLineTypes');
  const practitionerSuggester = new Suggester(api, 'practitioner');

  const createOrUpdateLineItem = useCallback(
    async data => {
      const invoiceLineItemData = {
        ...data,
        percentageChange: data.percentageChange ? data.percentageChange / 100 : undefined,
      };

      if (invoiceLineItem) {
        api.put(`invoices/${invoiceId}/lineItems/${invoiceLineItem.id}`, invoiceLineItemData);
      } else {
        api.post(`invoices/${invoiceId}/lineItems`, invoiceLineItemData);
      }
      onSaved();
    },
    [invoiceId, invoiceLineItem, api, onSaved],
  );

  const initialValues = invoiceLineItem
    ? {
        ...invoiceLineItem,
        price: invoiceLineItem.invoiceLineType.price,
        percentageChange:
          invoiceLineItem.percentageChange && invoiceLineItem.percentageChange * 100,
      }
    : {
        dateGenerated: getCurrentDateTimeString(),
      };

  return (
    <Modal width="md" title={title} open={open} onClose={onClose}>
      <Form
        onSubmit={createOrUpdateLineItem}
        render={({ submitForm }) => (
          <FormGrid>
            <Field
              name="dateGenerated"
              label="Date"
              required
              component={DateField}
              saveDateAsString
            />
            <Field
              name="invoiceLineTypeId"
              label="Details"
              required
              component={AutocompleteField}
              suggester={invoiceLineTypeSuggester}
            />
            <Field
              name="orderedById"
              label="Ordered by"
              required
              component={AutocompleteField}
              suggester={practitionerSuggester}
            />
            <Field name="price" label="Price ($)" required disabled component={NumberField} />
            <Field
              name="percentageChange"
              label="Discount/markup % (-/+)"
              component={NumberField}
            />
            <ConfirmCancelRow confirmText={actionText} onConfirm={submitForm} onCancel={onClose} />
          </FormGrid>
        )}
        initialValues={initialValues}
        validationSchema={yup.object().shape({
          invoiceLineTypeId: foreignKey('Details is required'),
          orderedById: foreignKey('Ordered by must be selected'),
          dateGenerated: yup.date().required(),
          percentageChange: yup.number(),
        })}
      />
    </Modal>
  );
};
