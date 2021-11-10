import React from 'react';
import * as yup from 'yup';

import { useApi } from '../api';
import { Suggester } from '../utils/suggester';
import { foreignKey } from '../utils/validation';

import {
  Form,
  Field,
  DateField,
  TextField,
  AutocompleteField,
  NumberField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { Button } from '../components/Button';
import { ButtonRow } from '../components/ButtonRow';

export const InvoicePriceChangeItemForm = ({
  actionText,
  onSubmit,
  onCancel,
  invoicePriceChangeItem,
}) => {
  const api = useApi();
  const practitionerSuggester = new Suggester(api, 'practitioner');

  return (
    <Form
      onSubmit={onSubmit}
      render={({ submitForm }) => (
        <FormGrid>
          <Field name="date" label="Date" required component={DateField} />
          <Field name="description" label="Details" required component={TextField} />
          <Field
            name="orderedById"
            label="Ordered by"
            required
            component={AutocompleteField}
            suggester={practitionerSuggester}
          />
          <Field
            name="percentageChange"
            label="Percentage change"
            required
            component={NumberField}
          />
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
        ...invoicePriceChangeItem,
      }}
      validationSchema={yup.object().shape({
        description: foreignKey('Details is required'),
        orderedById: foreignKey('Ordered by must be selected'),
        date: yup.date().required(),
        percentageChange: yup.number().required(),
      })}
    />
  );
};
