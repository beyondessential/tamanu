/*
 * Input labels in this component deliberately untranslated to match those in program import/export.
 */

import { useMutation } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { FORM_TYPES } from '@tamanu/constants/forms';
import {
  Button,
  Field,
  Form,
  FormGridThatFits,
  OutlinedButton,
  ReadOnlyTextField,
  TextField,
  TranslatedText,
} from '@tamanu/ui-components';
import { useApi } from '../../../../api';
import { FormModal } from '../../../../components';
import { NullableBooleanField } from '../../../../components/Field/NullableBooleanField';
import { notifyError, notifySuccess } from '../../../../utils';
import { VisibilityStatusField, visibilityStatusOptions } from '../components';

const Footer = styled.footer`
  border-block-start: 1px solid ${props => props.theme.palette.divider};
  display: flex;
  flex-direction: row-reverse;
  gap: 16px;
  justify-content: flex-start;
  margin-block-start: 24px;
  padding-block-start: 20px;
`;

const visibilityStatusValues = visibilityStatusOptions.map(option => option.value);

function parseNotifyEmailAddresses(csv) {
  if (csv == null || typeof csv !== 'string') return [];
  return csv
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
}

const validationSchema = yup.object().shape({
  isSensitive: yup.boolean().required('Required'),
  name: yup.string().trim().required('Required'),
  notifiable: yup.boolean().required('Required'),
  notifyEmailAddresses: yup.string().ensure(),
  surveyType: yup.string().trim().required('Required'),
  visibilityStatus: yup.string().required('Required').oneOf(visibilityStatusValues),
});

/**
 * @param {string} surveyId
 * @param {Omit<import('@tanstack/react-query').UseMutationOptions, 'mutationKey' | 'mutationFn'>} options
 */
function useSurveyMetadataMutation(surveyId, { onError, onSuccess, ...rest }) {
  const api = useApi();
  return useMutation({
    mutationKey: ['survey', surveyId, 'metadata'],
    mutationFn: async body => await api.patch(`admin/survey/${encodeURIComponent(surveyId)}`, body),
    onSuccess: (data, variables, context) => {
      notifySuccess(
        <TranslatedText
          stringId="admin.programs.surveys.formMetadataUpdateSuccess"
          fallback="Form metadata updated"
        />,
      );
      onSuccess?.(data, variables, context);
    },
    onError: (err, variables, context) => {
      notifyError(err?.message);
      onError?.(err, variables, context);
    },
    ...rest,
  });
}

/**
 * @param {{
 *   onClose: () => void;
 *   onSave?: () => void;
 *   open: boolean;
 *   survey: {
 *     code?: string;
 *     id: string;
 *     isSensitive?: boolean | null;
 *     name?: string;
 *     notifiable?: boolean | null;
 *     notifyEmailAddresses?: string[] | null;
 *     surveyType?: string;
 *     visibilityStatus?: string;
 *   };
 * }} props
 */
export function EditProgramSurveyMetadataModal({ onClose, onSave, open, survey }) {
  const { mutateAsync, isPending } = useSurveyMetadataMutation(survey.id, {
    onError: err => notifyError(err?.message),
    onSuccess: () => {
      onClose();
      onSave?.();
    },
  });

  const initialValues = useMemo(
    () => ({
      code: survey.code ?? '',
      isSensitive: survey.isSensitive ?? undefined,
      name: survey.name ?? '',
      notifiable: survey.notifiable ?? undefined,
      notifyEmailAddresses: Array.isArray(survey.notifyEmailAddresses)
        ? survey.notifyEmailAddresses.join(', ')
        : '',
      surveyType: survey.surveyType ?? '',
      visibilityStatus: survey.visibilityStatus ?? '',
    }),
    [survey],
  );

  const onSubmit = async ({
    isSensitive,
    name,
    notifiable,
    notifyEmailAddresses,
    surveyType,
    visibilityStatus,
  }) => {
    await mutateAsync({
      isSensitive,
      name: name.trim(),
      notifiable,
      notifyEmailAddresses: parseNotifyEmailAddresses(notifyEmailAddresses),
      surveyType: surveyType.trim(),
      visibilityStatus,
    });
  };

  return (
    <FormModal
      onClose={onClose}
      open={open}
      title={
        <TranslatedText
          stringId="admin.programs.surveys.editFormMetadata"
          fallback="Edit form metadata"
        />
      }
      width="md"
    >
      <Form
        enableReinitialize
        formType={FORM_TYPES.EDIT_FORM}
        initialValues={initialValues}
        onSubmit={onSubmit}
        render={({ submitForm }) => (
          <>
            <FormGridThatFits disabled={isPending}>
              <Field component={ReadOnlyTextField} label="code" name="code" required />
              <Field
                autoComplete="off"
                component={TextField}
                inputProps={{ maxLength: 255 }}
                label="name"
                name="name"
                required
              />
              <Field
                autoComplete="off"
                component={TextField}
                inputProps={{ maxLength: 255 }}
                label="surveyType"
                name="surveyType"
                required
              />
              <Field
                component={NullableBooleanField}
                label="isSensitive"
                name="isSensitive"
                required
              />
              <VisibilityStatusField
                disabled={isPending}
                label="visibilityStatus"
                name="visibilityStatus"
                required
              />
              <Field
                component={NullableBooleanField}
                label="notifiable"
                name="notifiable"
                required
              />
              <Field
                autoComplete="off"
                component={TextField}
                label="notifyEmailAddresses"
                name="notifyEmailAddresses"
              />
            </FormGridThatFits>
            <Footer>
              <Button isSubmitting={isPending} onClick={submitForm} type="submit">
                <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
              </Button>
              <OutlinedButton disabled={isPending} onClick={onClose}>
                <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
              </OutlinedButton>
            </Footer>
          </>
        )}
        validationSchema={validationSchema}
      />
    </FormModal>
  );
}
