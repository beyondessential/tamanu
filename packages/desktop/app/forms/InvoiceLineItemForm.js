import React from 'react';
import * as yup from 'yup';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';
import { foreignKey } from '../utils/validation';

import { Form, Field, DateField, AutocompleteField, NumberField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { Button } from '../components/Button';
import { ButtonRow } from '../components/ButtonRow';

export const InvoiceLineItemForm = ({ actionText, onSubmit, onCancel, editedObject }) => {
  const api = useApi();
  const invoiceLineTypeSuggester = new Suggester(api, 'invoiceLineTypes');
  const practitionerSuggester = new Suggester(api, 'practitioner');

  return (
    <Form
      onSubmit={onSubmit}
      render={({ submitForm }) => (
        <FormGrid>
          <Field name="date" label="Date" required component={DateField} />
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
          <Field name="price" label="Price" required disabled component={NumberField} />
          <Field name="percentageChange" label="Percentage change" component={NumberField} />
          <ButtonRow>
            <Button variant="contained" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="contained" onClick={submitForm} color="primary">
              {actionText}
            </Button>
          </ButtonRow>
        </FormGrid>
      )}
      initialValues={{
        date: new Date(),
        ...editedObject,
      }}
      validationSchema={yup.object().shape({
        invoiceLineTypeId: foreignKey('Details is required'),
        orderedById: foreignKey('Ordered by must be selected'),
        date: yup.date().required(),
        percentageChange: yup.number(),
      })}
    />
  );
};
