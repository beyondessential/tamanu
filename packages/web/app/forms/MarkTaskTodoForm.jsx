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
                <TranslatedText
                  stringId="task.form.recordedBy.label"
                  fallback="Recorded by"
                  data-test-id='translatedtext-3ai2' />
              }
              required
              component={AutocompleteField}
              suggester={practitionerSuggester}
              data-test-id='field-jthl' />
            <Field
              name="todoTime"
              label={
                <TranslatedText
                  stringId="task.form.recordTime.label"
                  fallback="Record date & time"
                  data-test-id='translatedtext-eqzb' />
              }
              required
              saveDateAsString
              component={DateTimeField}
              max={getCurrentDateTimeString()}
              data-test-id='field-k1dr' />
            <Field
              name="todoNote"
              label={<TranslatedText
                stringId="general.notes.label"
                fallback="Notes"
                data-test-id='translatedtext-3hdc' />}
              component={TextField}
              data-test-id='field-888q' />
          </FormGrid>
          <Divider style={{ margin: '32px -32px 30px -32px' }} />
          <FormSubmitCancelRow
            onCancel={onClose}
            onConfirm={submitForm}
            confirmText={<TranslatedText
              stringId="general.action.confirm"
              fallback="Confirm"
              data-test-id='translatedtext-zb1u' />}
            confirmDisabled={isLoading}
            data-test-id='formsubmitcancelrow-kgl9' />
        </div>
      )}
      validationSchema={yup.object().shape({
        todoByUserId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="task.form.recordedBy.label"
              fallback="Recorded by"
              data-test-id='translatedtext-9r46' />,
          ),
        todoTime: yup
          .date()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="task.form.recordTime.label"
              fallback="Record date & time"
              data-test-id='translatedtext-czfa' />,
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
