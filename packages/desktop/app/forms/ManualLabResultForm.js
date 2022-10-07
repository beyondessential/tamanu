import React, { useCallback } from 'react';

import * as yup from 'yup';
import { LAB_TEST_RESULT_TYPES } from 'shared/constants';
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

const componentsByResultType = {
  [LAB_TEST_RESULT_TYPES.FREE_TEXT]: TextField,
  [LAB_TEST_RESULT_TYPES.SELECT]: SelectField,
  [LAB_TEST_RESULT_TYPES.NUMBER]: NumberField,
}

function getComponentForTest(resultType) {
  return componentsByResultType[resultType] || TextField;
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
  const { resultType, options } = labTest.labTestType;
  const component = getComponentForTest(resultType);
  const methodSuggester = useSuggester('labTestMethod');

  const renderForm = useCallback(
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
        <Field
          label="Time of test"
          name="completedDate"
          component={DateTimeField}
          saveDateAsString
        />
        <ConfirmCancelRow onConfirm={submitForm} onCancel={onClose} />
      </FormGrid>
    ),
    [onClose, component, methodSuggester, options],
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
