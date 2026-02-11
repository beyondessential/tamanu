import React from 'react';
import { Divider } from '@material-ui/core';
import * as yup from 'yup';

import { FORM_TYPES } from '@tamanu/constants/forms';
import { Form, FormGrid, FormSubmitCancelRow, useDateTime } from '@tamanu/ui-components';

import {
  AutocompleteField,
  DateTimeField,
  Field,
  TranslatedText,
} from '../components';
import { useSuggester } from '../api';
import { useMarkTaskNotCompleted } from '../api/mutations/useTaskMutation';
import { useAuth } from '../contexts/Auth';
import { useTranslation } from '../contexts/Translation';

export const MarkTaskNotCompletedForm = ({ onClose, refreshTaskTable, taskIds }) => {
  const { getTranslation } = useTranslation();
  const practitionerSuggester = useSuggester('practitioner');
  const taskNotCompletedReasonSuggester = useSuggester('taskNotCompletedReason');
  const { currentUser, ability } = useAuth();
  const canCreateReferenceData = ability.can('create', 'ReferenceData');
  const { formatForDateTimeInput, getCurrentDateTime } =
    useDateTime();

  const { mutate: markTaskNotCompleted } = useMarkTaskNotCompleted();

  const onSubmit = async (values) => {
    const { notCompletedReasonId, ...others } = values;
    markTaskNotCompleted(
      {
        ...others,
        ...(notCompletedReasonId && { notCompletedReasonId }),
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
          <FormGrid data-testid="formgrid-klyc">
            <Field
              name="notCompletedByUserId"
              label={
                <TranslatedText
                  stringId="task.form.recordedBy.label"
                  fallback="Recorded by"
                  data-testid="translatedtext-5cw0"
                />
              }
              required
              component={AutocompleteField}
              suggester={practitionerSuggester}
              data-testid="field-maud"
            />
            <Field
              name="notCompletedTime"
              label={
                <TranslatedText
                  stringId="task.form.recordTime.label"
                  fallback="Record date & time"
                  data-testid="translatedtext-wtd5"
                />
              }
              required
              saveDateAsString
              component={DateTimeField}
              max={formatForDateTimeInput(getCurrentDateTime())}
              data-testid="field-sgto"
            />
            <Field
              name="notCompletedReasonId"
              label={
                <TranslatedText
                  stringId="task.form.reasonNotCompleted.label"
                  fallback="Reason not completed"
                  data-testid="translatedtext-xclu"
                />
              }
              component={AutocompleteField}
              suggester={taskNotCompletedReasonSuggester}
              allowCreatingCustomValue={canCreateReferenceData}
              data-testid="field-r3a1"
            />
          </FormGrid>
          <Divider style={{ margin: '32px -32px 30px -32px' }} data-testid="divider-f56n" />
          <FormSubmitCancelRow
            onCancel={onClose}
            onConfirm={submitForm}
            confirmText={
              <TranslatedText
                stringId="general.action.confirm"
                fallback="Confirm"
                data-testid="translatedtext-jtic"
              />
            }
            data-testid="formsubmitcancelrow-y08n"
          />
        </div>
      )}
      validationSchema={yup.object().shape({
        notCompletedByUserId: yup
          .string()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="task.form.recordedBy.label"
              fallback="Recorded by"
              data-testid="translatedtext-btml"
            />,
          ),
        notCompletedTime: yup
          .date()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="task.form.recordTime.label"
              fallback="Record date & time"
              data-testid="translatedtext-yh98"
            />,
          )
          .max(
            getCurrentDateTime(),
            getTranslation(
              'general.validation.date.cannotInFuture',
              'Date cannot be in the future',
            ),
          ),
        notCompletedReasonId: yup.string(),
      })}
      initialValues={{
        notCompletedTime: getCurrentDateTime(),
        notCompletedByUserId: currentUser?.id,
      }}
      data-testid="form-3cwo"
    />
  );
};
