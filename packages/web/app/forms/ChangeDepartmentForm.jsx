import React from 'react';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { Form, FormGrid, FormSubmitCancelRow } from '@tamanu/ui-components';

import * as yup from 'yup';

import { AutocompleteField, Field } from '../components/Field';
import { useEncounter } from '../contexts/Encounter';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const ChangeDepartmentForm = ({ onCancel, departmentSuggester, onSubmit }) => {
  const { encounter } = useEncounter();
  const renderForm = ({ submitForm }) => (
    <FormGrid columns={1} data-testid="formgrid-ln39">
      <Field
        label={
          <TranslatedText
            stringId="general.department.label"
            fallback="Department"
            data-testid="translatedtext-d130"
          />
        }
        name="departmentId"
        component={AutocompleteField}
        suggester={departmentSuggester}
        required
        data-testid="field-cy0j"
      />
      <FormSubmitCancelRow
        onConfirm={submitForm}
        confirmText={
          <TranslatedText
            stringId="general.action.save"
            fallback="Save"
            data-testid="translatedtext-1u70"
          />
        }
        onCancel={onCancel}
        data-testid="formsubmitcancelrow-s4op"
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
            <TranslatedText
              stringId="general.department.label"
              fallback="Department"
              data-testid="translatedtext-pvrf"
            />,
          ),
      })}
      render={renderForm}
      onSubmit={onSubmit}
      data-testid="form-1uj3"
    />
  );
};
