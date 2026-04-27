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
import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../../../api';
import { FormModal } from '../../../../components';
import { notifyError, notifySuccess } from '../../../../utils';
import { VisibilityStatusField, visibilityStatusOptions } from '../components';
import {
  programRegistryClinicalStatusColorOptions,
  ProgramRegistryClinicalStatusColorField,
} from './components';

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

/**
 * @param {ReadonlyArray<{ key: string }>} fields
 */
function buildValidationSchema(fields) {
  const shape = {
    code: yup.string(),
    name: yup.string().trim().required('Required'),
    visibilityStatus: yup.string().required('Required').oneOf(visibilityStatusValues),
  };
  if (fields.some(({ key }) => key === 'color')) {
    shape.color = yup
      .string()
      .required('Required')
      .oneOf(programRegistryClinicalStatusColorOptions.map(option => option.value));
  }
  return yup.object().shape(shape);
}

function RegistryTableRecordCodeField({ field }) {
  const label = field.title ?? field.key;
  return <Field name="code" component={ReadOnlyTextField} label={label} required />;
}

function RegistryTableRecordNameField({ field, disabled }) {
  const label = field.title ?? field.key;
  return <Field name="name" component={TextField} label={label} disabled={disabled} required />;
}

function RegistryTableRecordColorField({ field, disabled }) {
  const label = field.title ?? field.key;
  return (
    <ProgramRegistryClinicalStatusColorField
      disabled={disabled}
      label={label}
      name="color"
      required
    />
  );
}

function RegistryTableRecordVisibilityStatusField({ field, disabled }) {
  const label = field.title ?? field.key;
  return (
    <VisibilityStatusField disabled={disabled} label={label} name="visibilityStatus" required />
  );
}

const FIELD_COMPONENTS = /** @type {const} */ ({
  code: RegistryTableRecordCodeField,
  name: RegistryTableRecordNameField,
  color: RegistryTableRecordColorField,
  visibilityStatus: RegistryTableRecordVisibilityStatusField,
});

function renderFieldForDefinition(field, { disabled }) {
  const Component = FIELD_COMPONENTS[field.key];
  return Component ? <Component key={field.key} field={field} disabled={disabled} /> : null;
}

/**
 * @param {{
 *   recordId: string;
 *   resourceSegment:
 *     | 'programRegistryClinicalStatus'
 *     | 'programRegistryCondition'
 *     | 'programRegistryConditionCategory';
 * }} params
 * @param {Omit<import('@tanstack/react-query').UseMutationOptions, 'mutationKey' | 'mutationFn'>} options
 */
function usePatchProgramRegistrySubResourceMutation(
  { recordId, resourceSegment },
  { onError, onSuccess, ...rest } = {},
) {
  const api = useApi();
  return useMutation({
    mutationKey: [resourceSegment, recordId],
    mutationFn: async body =>
      await api.patch(`admin/${resourceSegment}/${encodeURIComponent(recordId)}`, body),
    onSuccess: (data, variables, context) => {
      notifySuccess(
        <TranslatedText
          stringId="admin.programRegistries.table.recordUpdateSuccess"
          fallback="Record updated"
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
 *   fields: readonly { key: string; title?: React.ReactNode }[];
 *   onClose: () => void;
 *   onSave?: () => void;
 *   open: boolean;
 *   record: { id: string; code: string; name: string; visibilityStatus: string; color?: string | null };
 *   resourceSegment: string;
 *   title: string;
 * }} props
 */
export function EditProgramRegistryTableRecordModal({
  fields,
  onClose,
  onSave,
  open,
  record,
  resourceSegment,
  title,
}) {
  const hasColor = fields.some(({ key }) => key === 'color');
  const validationSchema = useMemo(() => buildValidationSchema(fields), [fields]);

  const { mutateAsync, isLoading: isMutating } = usePatchProgramRegistrySubResourceMutation(
    { recordId: record.id, resourceSegment },
    {
      onSuccess: () => {
        onClose();
        onSave?.();
      },
    },
  );

  const initialValues = useMemo(
    () => ({
      code: record.code ?? '',
      name: record.name ?? '',
      visibilityStatus: record.visibilityStatus ?? '',
      color: record.color ?? '',
    }),
    [record],
  );

  const onSubmit = async ({ color, name, visibilityStatus }) => {
    const payload = { name: name?.trim(), visibilityStatus: visibilityStatus?.trim() };
    if (hasColor) payload.color = color?.trim();
    await mutateAsync(payload);
  };

  return (
    <FormModal onClose={onClose} open={open} title={title} width="md">
      <Form
        enableReinitialize
        formType={FORM_TYPES.EDIT_FORM}
        initialValues={initialValues}
        onSubmit={onSubmit}
        render={({ submitForm, isSubmitting }) => (
          <>
            <FormGridThatFits disabled={isSubmitting}>
              {fields.map(field => renderFieldForDefinition(field, { disabled: isMutating }))}
            </FormGridThatFits>
            <Footer>
              <Button isSubmitting={isMutating} onClick={submitForm} type="submit">
                <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
              </Button>
              <OutlinedButton disabled={isMutating} onClick={onClose}>
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
