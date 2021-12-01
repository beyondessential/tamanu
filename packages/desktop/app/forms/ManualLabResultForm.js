import React from 'react';

import * as yup from 'yup';
import {
  Form,
  Field,
  NumberField,
  TextField,
  SelectField,
  DateTimeField,
  AutocompleteField,
} from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { capitaliseFirstLetter } from '../utils/capitalise';
import { useSuggester } from '../api';

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
  const methodSuggester = useSuggester('labTestMethod');

  const renderForm = React.useCallback(
    ({ submitForm }) => (
      <FormGrid columns={1}>
        <Field
          label="Result"
          name="result"
          required
          component={component}
          options={renderOptions(options)}
        />
        <Field
          label="Test method"
          name="labTestMethodId"
          placeholder="Search methods"
          component={AutocompleteField}
          suggester={methodSuggester}
        />
        <Field label="Laboratory officer" name="laboratoryOfficer" component={TextField} />
        <Field label="Verification" name="verification" component={TextField} />
        <Field label="Time of test" name="completedDate" component={DateTimeField} />
        <ConfirmCancelRow onConfirm={submitForm} onCancel={onClose} />
      </FormGrid>
    ),
    [labTest, onClose, component],
  );

  return (
    <Form
      onSubmit={onSubmit}
      render={renderForm}
      initialValues={labTest}
      validationSchema={yup.object().shape({
        result: yup.mixed().required(),
      })}
    />
  );
};
