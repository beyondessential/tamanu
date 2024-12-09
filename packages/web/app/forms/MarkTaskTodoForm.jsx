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
import { useMarkTaskTodo } from '../api/mutations/useTaskMutation';
import { FORM_TYPES } from '../constants';
import { getCurrentDateTimeString } from '../utils/dateTime';
import { useAuth } from '../contexts/Auth';
import { useTranslation } from '../contexts/Translation';

export const MarkTaskTodoForm = ({ onClose, refreshTaskTable, taskIds }) => {
  const { getTranslation } = useTranslation();
  const practitionerSuggester = useSuggester('practitioner');
  const { mutate: markTaskTodo, isLoading } = useMarkTaskTodo();
  const { currentUser } = useAuth();

  const onSubmit = async values => {
    markTaskTodo(
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
              name="todoByUserId"
              label={
                <TranslatedText stringId="task.form.recordedBy.label" fallback="Recorded by" />
              }
              required
              component={AutocompleteField}
              suggester={practitionerSuggester}
            />
            <Field
              name="todoTime"
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
              name="todoNote"
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
        todoByUserId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText stringId="task.form.recordedBy.label" fallback="Recorded by" />,
          ),
        todoTime: yup
          .date()
          .required()
          .translatedLabel(
            <TranslatedText stringId="task.form.recordTime.label" fallback="Record date & time" />,
          )
          .max(
            getCurrentDateTimeString(),
            getTranslation(
              'general.validation.date.cannotInFuture',
              'Date cannot be in the future',
            ),
          ),
        todoNote: yup.string(),
      })}
      initialValues={{
        todoTime: getCurrentDateTimeString(),
        todoByUserId: currentUser?.id,
      }}
    />
  );
};
