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
import { useDeleteTask } from '../api/mutations/useTaskMutation';
import { FORM_TYPES } from '../constants';
import { getCurrentDateTimeString } from '../utils/dateTime';
import { useAuth } from '../contexts/Auth';

export const DeleteTaskForm = ({ onClose, refreshTaskTable, taskIds }) => {
  const practitionerSuggester = useSuggester('practitioner');
  const taskDeletionReasonSuggester = useSuggester('taskDeletionReason');
  const { currentUser } = useAuth();

  const { mutate: deleteTask } = useDeleteTask();

  const onSubmit = async values => {
    deleteTask(
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
              name="deletedByUserId"
              label={
                <TranslatedText stringId="task.form.recordedBy.label" fallback="Recorded by" />
              }
              required
              component={AutocompleteField}
              suggester={practitionerSuggester}
            />
            <Field
              name="deletedTime"
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
              name="deletedReasonId"
              label={
                <TranslatedText
                  stringId="task.form.reasonForDeletion.label"
                  fallback="Reason for deletion"
                />
              }
              component={AutocompleteField}
              suggester={taskDeletionReasonSuggester}
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
        deletedByUserId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText stringId="task.form.recordedBy.label" fallback="Recorded by" />,
          ),
        deletedTime: yup
          .date()
          .required()
          .translatedLabel(
            <TranslatedText stringId="task.form.recordTime.label" fallback="Record date & time" />,
          ),
        deletedReasonId: yup.string(),
      })}
      initialValues={{
        deletedTime: getCurrentDateTimeString(),
        deletedByUserId: currentUser?.id,
      }}
    />
  );
};
