import React from 'react';

import * as yup from 'yup';
import { Form, Field, NumberField, TextField, SelectField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { capitaliseFirstLetter } from '../utils/capitalise';

function getComponentForTest(questionType, options) {
  if (options && options.length) return SelectField;
  if (questionType === 'string') return TextField;
  return NumberField;
}

function renderOptions(options) {
  if (!options) return [];

  const trimmed = options.trim();
  if (!trimmed) return [];
  return trimmed
    .split(', ')
    .map(x => x.trim())
    .filter(x => x)
    .map(value => ({
      value,
      label: capitaliseFirstLetter(value),
    }));
}

export const ManualLabResultForm = ({ onSubmit, onClose, labTest }) => {
  const { questionType, options } = labTest.labTestType;
  const component = getComponentForTest(questionType, options);

  const renderForm = React.useCallback(
    ({ submitForm }) => (
      <FormGrid columns={1}>
        <Field name="result" required component={component} options={renderOptions(options)} />
        <ConfirmCancelRow onConfirm={submitForm} onCancel={onClose} />
      </FormGrid>
    ),
    [labTest, onClose, component],
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      validationSchema={yup.object().shape({
        result: yup.mixed().required(),
      })}
    />
  );
};
