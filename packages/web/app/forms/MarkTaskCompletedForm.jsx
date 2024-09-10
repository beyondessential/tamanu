import React from 'react';
import * as yup from 'yup';
import { Divider } from '@material-ui/core';

import {
  AutocompleteField,
  DateTimeField,
  Field,
  Form,
  FormGrid,
  FormSubmitCancelRow,
  TextField,
  TranslatedText,
} from '../components';
import { useSuggester } from '../api';
import { useMarkTaskCompleted } from '../api/mutations/useTaskMutation';
import { FORM_TYPES } from '../constants';

export const MarkTaskCompletedForm = ({ onClose, refreshTaskTable, taskIds }) => {
  const practitionerSuggester = useSuggester('practitioner');
  const { mutate: markTaskCompleted, isLoading } = useMarkTaskCompleted();

  const onSubmit = async values => {
    const { completedTime, ...others } = values;
    markTaskCompleted(
      {
        ...others,
        taskIds,
        completedTime: new Date(completedTime).toISOString(),
      },
      {
        onSuccess: () => {
          refreshTaskTable();
          onClose();
        },
      },
    );
  };

  return (
    <Form
      onSubmit={onSubmit}
      formType={FORM_TYPES.CREATE_FORM}
      render={({ submitForm }) => (
        <div>
          <FormGrid>
            <Field
              name="completedBy"
              label={
                <TranslatedText stringId="task.form.completedBy.label" fallback="Completed by" />
              }
              required
              component={AutocompleteField}
              suggester={practitionerSuggester}
            />
            <Field
              name="completedTime"
              label={
                <TranslatedText
                  stringId="task.form.completedTime.label"
                  fallback="Completed date & time"
                />
              }
              saveDateAsString
              required
              component={DateTimeField}
            />
            <Field
              name="completedNote"
              label={<TranslatedText stringId="general.notes.label" fallback="Notes" />}
              component={TextField}
            />
          </FormGrid>
          <Divider style={{ margin: '32px -32px 30px -32px' }} />
          <FormSubmitCancelRow
            onCancel={onClose}
            onConfirm={submitForm}
            confirmText={<TranslatedText stringId="general.action.confirm" fallback="Confirm" />}
            confirmDisabled={isLoading}
          />
        </div>
      )}
      validationSchema={yup.object().shape({
        completedBy: yup.string().required(),
        completedTime: yup.date().required(),
        completedNote: yup.string(),
      })}
    />
  );
};
