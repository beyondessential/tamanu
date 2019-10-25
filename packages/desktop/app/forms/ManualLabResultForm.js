import React from 'react';

import { Form, Field, NumberField, TextField, SelectField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';
import * as yup from 'yup';

function getComponentForTest(questionType, options) {
  if(options && options.length) return SelectField;
  if(questionType === "string") return TextField;
  return NumberField;
}

function renderOptions(options) {
  if(!options) return [];

  return options.map(value => ({
    value,
    label: value.slice(0, 1).toUpperCase() + value.slice(1),
  }));
}

export const ManualLabResultForm = ({ onSubmit, onClose, labTest }) => {
  const { questionType, options } = labTest.type;
  const component = getComponentForTest(questionType, options);

  const renderForm = React.useCallback(({ submitForm }) => (
    <FormGrid columns={1}>
      <Field 
        name="result" 
        required 
        component={component}
        options={renderOptions(options)}
      />
      <ConfirmCancelRow onConfirm={submitForm} onCancel={onClose} />
    </FormGrid>
  ), [labTest, onClose, component]);

  return (
    <Form
      onSubmit={onSubmit} 
      render={renderForm}
      validationSchema={
        yup.object().shape({
          result: yup.mixed().required(),
        })
      }
    />
  );
};
