import React from 'react';
import { Divider } from '@material-ui/core';
import * as yup from 'yup';

import {
  AutocompleteField,
  DateTimeField,
  Field,
  Form,
  FormGrid,
  FormSubmitCancelRow,
  TranslatedText,
} from '../components';
import { useSuggester } from '../api';
import { useMarkTaskNotCompleted } from '../api/mutations/useTaskMutation';
import { FORM_TYPES } from '../constants';

export const MarkTaskNotCompletedForm = ({ onClose, refreshTaskTable, taskIds }) => {
  const practitionerSuggester = useSuggester('practitioner');
  const taskNotCompletedReasonSuggester = useSuggester('taskNotCompletedReason');

  const { mutate: markTaskNotCompleted } = useMarkTaskNotCompleted();

  const onSubmit = async values => {
    const { notCompletedTime, ...others } = values;
    markTaskNotCompleted(
      {
        ...others,
        taskIds,
        notCompletedTime: new Date(notCompletedTime).toISOString(),
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
              name="notCompletedBy"
              label={
                <TranslatedText stringId="task.form.recordedBy.label" fallback="Recorded by" />
              }
              required
              component={AutocompleteField}
              suggester={practitionerSuggester}
            />
            <Field
              name="notCompletedTime"
              label={
                <TranslatedText
                  stringId="task.form.recordTime.label"
                  fallback="Record date & time"
                />
              }
              saveDateAsString
              required
              component={DateTimeField}
            />
            <Field
              name="notCompletedReasonId"
              label={
                <TranslatedText
                  stringId="task.form.reasonNotCompleted.label"
                  fallback="Reason not completed"
                />
              }
              component={AutocompleteField}
              suggester={taskNotCompletedReasonSuggester}
            />
          </FormGrid>
          <Divider style={{ margin: '32px -32px 30px -32px' }} />
          <FormSubmitCancelRow
            onCancel={onClose}
            onConfirm={submitForm}
            confirmText={<TranslatedText stringId="general.action.confirm" fallback="Confirm" />}
          />
        </div>
      )}
      validationSchema={yup.object().shape({
        notCompletedBy: yup.string().required(),
        notCompletedTime: yup.date().required(),
        notCompletedReasonId: yup.string(),
      })}
    />
  );
};
