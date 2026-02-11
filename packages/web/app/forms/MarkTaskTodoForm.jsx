import React from 'react';
import * as yup from 'yup';
import { Divider } from '@material-ui/core';

import { AutocompleteField, DateTimeField, Field, TranslatedText } from '../components';
import { TextField, Form, FormGrid, FormSubmitCancelRow, useDateTime } from '@tamanu/ui-components';
import { FORM_TYPES } from '@tamanu/constants/forms';
import { useSuggester } from '../api';
import { useMarkTaskTodo } from '../api/mutations/useTaskMutation';
import { useAuth } from '../contexts/Auth';
import { useTranslation } from '../contexts/Translation';

export const MarkTaskTodoForm = ({ onClose, refreshTaskTable, taskIds }) => {
  const { getFacilityNow, getCurrentDateTime } = useDateTime();
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
          <FormGrid data-testid="formgrid-eb8r">
            <Field
              name="todoByUserId"
              label={
                <TranslatedText
                  stringId="task.form.recordedBy.label"
                  fallback="Recorded by"
                  data-testid="translatedtext-0ul4"
                />
              }
              required
              component={AutocompleteField}
              suggester={practitionerSuggester}
              data-testid="field-2bbc"
            />
            <Field
              name="todoTime"
              label={
                <TranslatedText
                  stringId="task.form.recordTime.label"
                  fallback="Record date & time"
                  data-testid="translatedtext-yrvc"
                />
              }
              required
              saveDateAsString
              component={DateTimeField}
              max={getFacilityNow()}
              data-testid="field-c16y"
            />
            <Field
              name="todoNote"
              label={
                <TranslatedText
                  stringId="general.notes.label"
                  fallback="Notes"
                  data-testid="translatedtext-79ep"
                />
              }
              component={TextField}
              data-testid="field-2ubq"
            />
          </FormGrid>
          <Divider style={{ margin: '32px -32px 30px -32px' }} data-testid="divider-9xz6" />
          <FormSubmitCancelRow
            onCancel={onClose}
            onConfirm={submitForm}
            confirmText={
              <TranslatedText
                stringId="general.action.confirm"
                fallback="Confirm"
                data-testid="translatedtext-i186"
              />
            }
            confirmDisabled={isLoading}
            data-testid="formsubmitcancelrow-8b84"
          />
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
              data-testid="translatedtext-gb6o"
            />,
          ),
        todoTime: yup
          .date()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="task.form.recordTime.label"
              fallback="Record date & time"
              data-testid="translatedtext-d5ow"
            />,
          )
          .max(
            getFacilityNow(),
            getTranslation(
              'general.validation.date.cannotInFuture',
              'Date cannot be in the future',
            ),
          ),
        todoNote: yup.string(),
      })}
      initialValues={{
        todoTime: getCurrentDateTime(),
        todoByUserId: currentUser?.id,
      }}
      data-testid="form-vu9o"
    />
  );
};
