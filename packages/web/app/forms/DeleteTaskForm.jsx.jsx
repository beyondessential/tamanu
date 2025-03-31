import React from 'react';
import { Divider } from '@material-ui/core';
import * as yup from 'yup';
import { TASK_DELETE_BY_SYSTEM_REASON } from '@tamanu/constants';

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
import { useTranslation } from '../contexts/Translation';

export const DeleteTaskForm = ({ onClose, refreshTaskTable, taskIds }) => {
  const { getTranslation } = useTranslation();
  const practitionerSuggester = useSuggester('practitioner');
  const taskDeletionReasonSuggester = useSuggester('taskDeletionReason');
  const { currentUser, ability } = useAuth();
  const canCreateReferenceData = ability.can('create', 'ReferenceData');

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
      showInlineErrorsOnly
      onSubmit={onSubmit}
      formType={FORM_TYPES.CREATE_FORM}
      render={({ submitForm }) => (
        <div>
          <FormGrid>
            <Field
              name="deletedByUserId"
              label={
                <TranslatedText
                  stringId="task.form.recordedBy.label"
                  fallback="Recorded by"
                  data-testid='translatedtext-vc0r' />
              }
              required
              component={AutocompleteField}
              suggester={practitionerSuggester}
              data-testid='field-wjkc' />
            <Field
              name="deletedTime"
              label={
                <TranslatedText
                  stringId="task.form.recordTime.label"
                  fallback="Record date & time"
                  data-testid='translatedtext-qtib' />
              }
              required
              saveDateAsString
              component={DateTimeField}
              max={getCurrentDateTimeString()}
              data-testid='field-crl3' />
            <Field
              name="deletedReasonId"
              label={
                <TranslatedText
                  stringId="task.form.reasonForDeletion.label"
                  fallback="Reason for deletion"
                  data-testid='translatedtext-umxw' />
              }
              component={AutocompleteField}
              suggester={taskDeletionReasonSuggester}
              allowCreatingCustomValue={canCreateReferenceData}
              filterer={({ value }) => value !== TASK_DELETE_BY_SYSTEM_REASON}
              data-testid='field-f2cj' />
          </FormGrid>
          <Divider style={{ margin: '32px -32px 30px -32px' }} />
          <FormSubmitCancelRow
            onCancel={onClose}
            onConfirm={submitForm}
            confirmText={<TranslatedText
              stringId="general.action.confirm"
              fallback="Confirm"
              data-testid='translatedtext-3de1' />}
            data-testid='formsubmitcancelrow-7elq' />
        </div>
      )}
      validationSchema={yup.object().shape({
        deletedByUserId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="task.form.recordedBy.label"
              fallback="Recorded by"
              data-testid='translatedtext-1k7u' />,
          ),
        deletedTime: yup
          .date()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="task.form.recordTime.label"
              fallback="Record date & time"
              data-testid='translatedtext-lld2' />,
          )
          .max(
            getCurrentDateTimeString(),
            getTranslation(
              'general.validation.date.cannotInFuture',
              'Date cannot be in the future',
            ),
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
