import React from 'react';
import * as yup from 'yup';
import { Divider } from '@material-ui/core';

import { AutocompleteField, DateTimeField, Field, TranslatedText } from '../components';
import { FORM_TYPES } from '@tamanu/constants/forms';
import {
  TextField,
  Form,
  FormGrid,
  FormSubmitCancelRow,
  useDateTimeFormat,
} from '@tamanu/ui-components';
import { useSuggester } from '../api';
import { useMarkTaskCompleted } from '../api/mutations/useTaskMutation';
import { useAuth } from '../contexts/Auth';
import { useTranslation } from '../contexts/Translation';

export const MarkTaskCompletedForm = ({ onClose, refreshTaskTable, taskIds }) => {
  const { getTranslation } = useTranslation();
  const { getFacilityNow } = useDateTimeFormat();
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
          <FormGrid data-testid="formgrid-z4yb">
            <Field
              name="completedByUserId"
              label={
                <TranslatedText
                  stringId="task.form.completedBy.label"
                  fallback="Completed by"
                  data-testid="translatedtext-ozw5"
                />
              }
              required
              component={AutocompleteField}
              suggester={practitionerSuggester}
              data-testid="field-4r4u"
            />
            <Field
              name="completedTime"
              label={
                <TranslatedText
                  stringId="task.form.completedTime.label"
                  fallback="Completed date & time"
                  data-testid="translatedtext-ty14"
                />
              }
              required
              saveDateAsString
              component={DateTimeField}
              max={getFacilityNow()}
              data-testid="field-el3t"
            />
            <Field
              name="completedNote"
              label={
                <TranslatedText
                  stringId="general.notes.label"
                  fallback="Notes"
                  data-testid="translatedtext-g3lg"
                />
              }
              component={TextField}
              data-testid="field-kvze"
            />
          </FormGrid>
          <Divider style={{ margin: '32px -32px 30px -32px' }} data-testid="divider-k0fj" />
          <FormSubmitCancelRow
            onCancel={onClose}
            onConfirm={submitForm}
            confirmText={
              <TranslatedText
                stringId="general.action.confirm"
                fallback="Confirm"
                data-testid="translatedtext-h8ty"
              />
            }
            confirmDisabled={isLoading}
            data-testid="formsubmitcancelrow-v41o"
          />
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
              data-testid="translatedtext-943b"
            />,
          ),
        completedTime: yup
          .date()
          .required()
          .translatedLabel(
            <TranslatedText
              stringId="task.form.completedTime.label"
              fallback="Completed date & time"
              data-testid="translatedtext-fu46"
            />,
          )
          .max(
            getCurrentDateTime(),
            getTranslation(
              'general.validation.date.cannotInFuture',
              'Date cannot be in the future',
            ),
          ),
        completedNote: yup.string(),
      })}
      initialValues={{
        completedTime: getCurrentDateTime(),
        completedByUserId: currentUser?.id,
      }}
      data-testid="form-fiov"
    />
  );
};
