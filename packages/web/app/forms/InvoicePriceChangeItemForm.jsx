import React from 'react';
import * as yup from 'yup';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
import { useSuggester } from '../api';
import { foreignKey } from '../utils/validation';

import {
  AutocompleteField,
  DateField,
  Field,
  Form,
  NumberField,
  TextField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';
import { FORM_TYPES } from '../constants';

export const InvoicePriceChangeItemForm = ({
  actionText,
  onSubmit,
  onCancel,
  invoicePriceChangeItem,
}) => {
  const practitionerSuggester = useSuggester('practitioner');

  return (
    <Form
      onSubmit={onSubmit}
      render={({ submitForm }) => (
        <FormGrid>
          <Field name="date" label="Date" required component={DateField} saveDateAsString />
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
            label="Discount/markup % (-/+)"
            required
            component={NumberField}
          />
          <FormSubmitCancelRow
            confirmText={actionText}
            onConfirm={submitForm}
            onCancel={onCancel}
          />
        </FormGrid>
      )}
      initialValues={{
        date: getCurrentDateTimeString(),
        ...invoicePriceChangeItem,
      }}
      formType={invoicePriceChangeItem ? FORM_TYPES.EDIT_FORM : FORM_TYPES.CREATE_FORM}
      validationSchema={yup.object().shape({
        description: foreignKey('Details is required'),
        orderedById: foreignKey('Ordered by must be selected'),
        date: yup.date().required(),
        percentageChange: yup.number().required(),
      })}
    />
  );
};
