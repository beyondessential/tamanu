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
import { getCurrentDateTimeString } from '../utils/dateTime';
import { useAuth } from '../contexts/Auth';
import { useTranslation } from '../contexts/Translation';

export const MarkTaskCompletedForm = ({ onClose, refreshTaskTable, taskIds }) => {
  const { getTranslation } = useTranslation();
  const practitionerSuggester = useSuggester('practitioner');
  const { mutate: markTaskCompleted, isLoading } = useMarkTaskCompleted();
  const { currentUser } = useAuth();

  const onSubmit = async values => {
    markTaskCompleted(
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
              name="completedByUserId"
              label={
                <TranslatedText
                  stringId="task.form.completedBy.label"
                  fallback="Completed by"
                  data-test-id='translatedtext-6bot' />
              }
              required
              component={AutocompleteField}
              suggester={practitionerSuggester}
              data-test-id='field-u027' />
            <Field
              name="completedTime"
              label={
                <TranslatedText
                  stringId="task.form.completedTime.label"
                  fallback="Completed date & time"
                  data-test-id='translatedtext-wlxm' />
              }
              required
              saveDateAsString
              component={DateTimeField}
              max={getCurrentDateTimeString()}
              data-test-id='field-dvdb' />
            <Field
              name="completedNote"
              label={<TranslatedText
                stringId="general.notes.label"
                fallback="Notes"
                data-test-id='translatedtext-fjnd' />}
              component={TextField}
              data-test-id='field-1xpf' />
          </FormGrid>
          <Divider style={{ margin: '32px -32px 30px -32px' }} />
          <FormSubmitCancelRow
            onCancel={onClose}
            onConfirm={submitForm}
            confirmText={<TranslatedText
              stringId="general.action.confirm"
              fallback="Confirm"
              data-test-id='translatedtext-jzzp' />}
            confirmDisabled={isLoading}
            data-test-id='formsubmitcancelrow-fcz5' />
        </div>
      )}
      validationSchema={yup.object().shape({
        completedByUserId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="task.form.completedBy.label"
              fallback="Completed by"
              data-test-id='translatedtext-ljbq' />,
          ),
        completedTime: yup
          .date()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="task.form.completedTime.label"
              fallback="Completed date & time"
              data-test-id='translatedtext-llx4' />,
          )
          .max(
            getCurrentDateTimeString(),
            getTranslation(
              'general.validation.date.cannotInFuture',
              'Date cannot be in the future',
            ),
          ),
        completedNote: yup.string(),
      })}
      initialValues={{
        completedTime: getCurrentDateTimeString(),
        completedByUserId: currentUser?.id,
      }}
    />
  );
};
