import React from 'react';
import { Divider } from '@material-ui/core';
import * as yup from 'yup';

import { TASK_DELETE_BY_SYSTEM_REASON, FORM_TYPES } from '@tamanu/constants';
import { Form, FormGrid, FormSubmitCancelRow, useDateTimeFormat } from '@tamanu/ui-components';

import {
  AutocompleteField,
  DateTimeField,
  Field,
  TranslatedText,
} from '../components';
import { useSuggester } from '../api';
import { useDeleteTask } from '../api/mutations/useTaskMutation';
import { useAuth } from '../contexts/Auth';
import { useTranslation } from '../contexts/Translation';

export const DeleteTaskForm = ({ onClose, refreshTaskTable, taskIds }) => {
  const { getCountryCurrentDateTimeString, getFacilityCurrentDateTimeString } = useDateTimeFormat();
  const { getTranslation } = useTranslation();
  const practitionerSuggester = useSuggester('practitioner');
  const taskDeletionReasonSuggester = useSuggester('taskDeletionReason');
  const { currentUser, ability } = useAuth();
  const canCreateReferenceData = ability.can('create', 'ReferenceData');

  const { mutate: deleteTask } = useDeleteTask();

  const onSubmit = async (values) => {
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
          <FormGrid data-testid="formgrid-7wfg">
            <Field
              name="deletedByUserId"
              label={
                <TranslatedText
                  stringId="task.form.recordedBy.label"
                  fallback="Recorded by"
                  data-testid="translatedtext-9efh"
                />
              }
              required
              component={AutocompleteField}
              suggester={practitionerSuggester}
              data-testid="field-2l6f"
            />
            <Field
              name="deletedTime"
              label={
                <TranslatedText
                  stringId="task.form.recordTime.label"
                  fallback="Record date & time"
                  data-testid="translatedtext-cywv"
                />
              }
              required
              saveDateAsString
              component={DateTimeField}
              max={getFacilityCurrentDateTimeString()}
              data-testid="field-bnve"
            />
            <Field
              name="deletedReasonId"
              label={
                <TranslatedText
                  stringId="task.form.reasonForDeletion.label"
                  fallback="Reason for deletion"
                  data-testid="translatedtext-vetn"
                />
              }
              component={AutocompleteField}
              suggester={taskDeletionReasonSuggester}
              allowCreatingCustomValue={canCreateReferenceData}
              filterer={({ value }) => value !== TASK_DELETE_BY_SYSTEM_REASON}
              data-testid="field-4x58"
            />
          </FormGrid>
          <Divider style={{ margin: '32px -32px 30px -32px' }} data-testid="divider-wg6w" />
          <FormSubmitCancelRow
            onCancel={onClose}
            onConfirm={submitForm}
            confirmText={
              <TranslatedText
                stringId="general.action.confirm"
                fallback="Confirm"
                data-testid="translatedtext-30q4"
              />
            }
            data-testid="formsubmitcancelrow-0v1x"
          />
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
              data-testid="translatedtext-0bo0"
            />,
          ),
        deletedTime: yup
          .date()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="task.form.recordTime.label"
              fallback="Record date & time"
              data-testid="translatedtext-2tze"
            />,
          )
          .max(
            getFacilityCurrentDateTimeString(),
            getTranslation(
              'general.validation.date.cannotInFuture',
              'Date cannot be in the future',
            ),
          ),
        deletedReasonId: yup.string(),
      })}
      initialValues={{
        deletedTime: getCountryCurrentDateTimeString(),
        deletedByUserId: currentUser?.id,
      }}
      data-testid="form-nv8b"
    />
  );
};
