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
import { getCurrentDateTimeString } from '../utils/dateTime';
import { useAuth } from '../contexts/Auth';

export const MarkTaskNotCompletedForm = ({ onClose, refreshTaskTable, taskIds }) => {
  const practitionerSuggester = useSuggester('practitioner');
  const taskNotCompletedReasonSuggester = useSuggester('taskNotCompletedReason');
  const { currentUser } = useAuth();

  const { mutate: markTaskNotCompleted } = useMarkTaskNotCompleted();

  const onSubmit = async values => {
    markTaskNotCompleted(
      {
        ...values,
        taskIds,
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
              name="notCompletedByUserId"
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
              required
              saveDateAsString
              component={DateTimeField}
              max={getCurrentDateTimeString()}
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
        notCompletedByUserId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText stringId="task.form.recordedBy.label" fallback="Recorded by" />,
          ),
        notCompletedTime: yup
          .date()
          .required()
          .translatedLabel(
            <TranslatedText stringId="task.form.recordTime.label" fallback="Record date & time" />,
          ),
        notCompletedReasonId: yup.string(),
      })}
      initialValues={{
        notCompletedTime: getCurrentDateTimeString(),
        notCompletedByUserId: currentUser?.id,
      }}
    />
  );
};
