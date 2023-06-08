import React from 'react';
import { getCurrentDateTimeString } from 'shared/utils/dateTime';

import * as yup from 'yup';

import { Form, Field, AutocompleteField } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { ConfirmCancelRow } from '../components/ButtonRow';
import { useEncounter } from '../contexts/Encounter';

export const ChangeDepartmentForm = ({ onCancel, departmentSuggester, onSubmit }) => {
  const { encounter } = useEncounter();
  const renderForm = ({ submitForm }) => (
    <FormGrid columns={1}>
      <Field
        label="Department"
        name="departmentId"
        component={AutocompleteField}
        suggester={departmentSuggester}
        required
      />
      <ConfirmCancelRow onConfirm={submitForm} confirmText="Save" onCancel={onCancel} />
    </FormGrid>
  );

  return (
    <Form
      initialValues={{
        departmentId: encounter.departmentId,
        // Used in creation of associated notes
        submittedTime: getCurrentDateTimeString(),
      }}
      validationSchema={yup.object().shape({
        departmentId: yup.string().required('Department is required'),
      })}
      render={renderForm}
      onSubmit={onSubmit}
    />
  );
};
