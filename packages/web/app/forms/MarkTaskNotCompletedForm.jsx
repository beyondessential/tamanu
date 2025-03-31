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
import { useTranslation } from '../contexts/Translation';

export const MarkTaskNotCompletedForm = ({ onClose, refreshTaskTable, taskIds }) => {
  const { getTranslation } = useTranslation();
  const practitionerSuggester = useSuggester('practitioner');
  const taskNotCompletedReasonSuggester = useSuggester('taskNotCompletedReason');
  const { currentUser, ability } = useAuth();
  const canCreateReferenceData = ability.can('create', 'ReferenceData');

  const { mutate: markTaskNotCompleted } = useMarkTaskNotCompleted();

  const onSubmit = async values => {
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
          <FormGrid>
            <Field
              name="notCompletedByUserId"
              label={
                <TranslatedText
                  stringId="task.form.recordedBy.label"
                  fallback="Recorded by"
                  data-testid='translatedtext-ruks' />
              }
              required
              component={AutocompleteField}
              suggester={practitionerSuggester}
              data-testid='field-picg' />
            <Field
              name="notCompletedTime"
              label={
                <TranslatedText
                  stringId="task.form.recordTime.label"
                  fallback="Record date & time"
                  data-testid='translatedtext-nit1' />
              }
              required
              saveDateAsString
              component={DateTimeField}
              max={getCurrentDateTimeString()}
              data-testid='field-8jne' />
            <Field
              name="notCompletedReasonId"
              label={
                <TranslatedText
                  stringId="task.form.reasonNotCompleted.label"
                  fallback="Reason not completed"
                  data-testid='translatedtext-9hvv' />
              }
              component={AutocompleteField}
              suggester={taskNotCompletedReasonSuggester}
              allowCreatingCustomValue={canCreateReferenceData}
              data-testid='field-sl0f' />
          </FormGrid>
          <Divider style={{ margin: '32px -32px 30px -32px' }} />
          <FormSubmitCancelRow
            onCancel={onClose}
            onConfirm={submitForm}
            confirmText={<TranslatedText
              stringId="general.action.confirm"
              fallback="Confirm"
              data-testid='translatedtext-yjfp' />}
            data-testid='formsubmitcancelrow-wcwr' />
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
              data-testid='translatedtext-t8db' />,
          ),
        notCompletedTime: yup
          .date()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="task.form.recordTime.label"
              fallback="Record date & time"
              data-testid='translatedtext-ne6v' />,
          )
          .max(
            getCurrentDateTimeString(),
            getTranslation(
              'general.validation.date.cannotInFuture',
              'Date cannot be in the future',
            ),
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
