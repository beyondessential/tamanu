import React from 'react';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';

import * as yup from 'yup';

import { AutocompleteField, Field, Form } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';
import { useEncounter } from '../contexts/Encounter';
import { FORM_TYPES } from '../constants';

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
      <FormSubmitCancelRow onConfirm={submitForm} confirmText="Save" onCancel={onCancel} />
    </FormGrid>
  );

  return (
    <Form
      initialValues={{
        departmentId: encounter.departmentId,
        // Used in creation of associated notes
        submittedTime: getCurrentDateTimeString(),
      }}
      formType={FORM_TYPES.EDIT_DATA_FORM}
      validationSchema={yup.object().shape({
        departmentId: yup.string().required('Department is required'),
      })}
      render={renderForm}
      onSubmit={onSubmit}
    />
  );
};
