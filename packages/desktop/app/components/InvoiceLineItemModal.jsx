import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import React, { useCallback } from 'react';
import * as yup from 'yup';
import { useApi } from '../api';
import { Suggester } from '../utils/suggester';
import { foreignKey } from '../utils/validation';
import { FormSubmitCancelRow } from './ButtonRow';
import { AutocompleteField, DateField, Field, Form, NumberField } from './Field';
import { FormGrid } from './FormGrid';
import { FormModal } from './FormModal';

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
        await api.put(`invoices/${invoiceId}/lineItems/${invoiceLineItem.id}`, invoiceLineItemData);
      } else {
        await api.post(`invoices/${invoiceId}/lineItems`, invoiceLineItemData);
      }
      onSaved();
    },
    [invoiceId, invoiceLineItem, api, onSaved],
  );

  const initialValues = invoiceLineItem
    ? {
      ...invoiceLineItem,
      price: invoiceLineItem.invoiceLineType.price,
      percentageChange: invoiceLineItem.percentageChange && invoiceLineItem.percentageChange * 100,
    }
    : {
      dateGenerated: getCurrentDateTimeString(),
    };

  return (
    <FormModal width="md" title={title} open={open} onClose={onClose}>
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
            <FormSubmitCancelRow
              confirmText={actionText}
              onConfirm={submitForm}
              onCancel={onClose}
            />
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
    </FormModal>
  );
};
