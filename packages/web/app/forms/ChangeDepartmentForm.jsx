import React from 'react';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';

import * as yup from 'yup';

import { AutocompleteField, Field, Form } from '../components/Field';
import { FormGrid } from '../components/FormGrid';
import { FormSubmitCancelRow } from '../components/ButtonRow';
import { useEncounter } from '../contexts/Encounter';
import { FORM_TYPES } from '../constants';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const ChangeDepartmentForm = ({ onCancel, departmentSuggester, onSubmit }) => {
  const { encounter } = useEncounter();
  const renderForm = ({ submitForm }) => (
    <FormGrid columns={1}>
      <Field
        label={<TranslatedText stringId="general.department.label" fallback="Department" />}
        name="departmentId"
        component={AutocompleteField}
        suggester={departmentSuggester}
        required
      />
      <FormSubmitCancelRow
        onConfirm={submitForm}
        confirmText={<TranslatedText stringId="general.action.save" fallback="Save" />}
        onCancel={onCancel}
      />
    </FormGrid>
  );

  return (
    <Form
      initialValues={{
        departmentId: encounter.departmentId,
        // Used in creation of associated notes
        submittedTime: getCurrentDateTimeString(),
      }}
      formType={FORM_TYPES.EDIT_FORM}
      validationSchema={yup.object().shape({
        departmentId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText stringId="general.department.label" fallback="Department" />,
          ),
      })}
      render={renderForm}
      onSubmit={onSubmit}
    />
  );
};
