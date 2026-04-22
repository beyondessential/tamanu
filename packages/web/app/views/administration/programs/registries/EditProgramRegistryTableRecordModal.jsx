import React, { useMemo } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { FORM_TYPES } from '@tamanu/constants/forms';
import {
  Button,
  Field,
  Form,
  OutlinedButton,
  ReadOnlyTextField,
  TextField,
  TranslatedText,
} from '@tamanu/ui-components';
import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../../../api';
import { FormModal } from '../../../../components';
import { notifyError, notifySuccess } from '../../../../utils';
import { VisibilityStatusSelectField, visibilityStatusSelectOptions } from '../components';

const Fieldset = styled.fieldset`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: 0.8rem;
`;

const Footer = styled.footer`
  border-block-start: 1px solid ${props => props.theme.palette.divider};
  display: flex;
  flex-direction: row-reverse;
  gap: 16px;
  justify-content: flex-start;
  margin-block-start: 24px;
  padding-block-start: 20px;
`;

const visibilityStatusValues = visibilityStatusSelectOptions.map(option => option.value);

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
    shape.color = yup.string().nullable();
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
  return <Field name="color" component={TextField} label={label} disabled={disabled} required />;
}

function RegistryTableRecordVisibilityStatusField({ field, isPending }) {
  const label = field.title ?? field.key;
  return (
    <VisibilityStatusSelectField
      disabled={isPending}
      label={label}
      name="visibilityStatus"
      required
    />
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
 * @param {string} resourceSegment
 * @param {string} recordId
 */
function usePatchProgramRegistrySubResourceMutation(resourceSegment, recordId) {
  const api = useApi();
  return useMutation({
    mutationKey: [resourceSegment, recordId],
    mutationFn: async body =>
      await api.patch(`admin/${resourceSegment}/${encodeURIComponent(recordId)}`, body),
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

  const { mutateAsync, isPending } = usePatchProgramRegistrySubResourceMutation(
    resourceSegment,
    record.id,
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
    await mutateAsync(payload, {
      onSuccess: () => {
        notifySuccess(
          <TranslatedText
            stringId="admin.programRegistries.table.recordUpdateSuccess"
            fallback="Record updated"
          />,
        );
        onSave?.();
        onClose();
      },
      onError: err => notifyError(err?.message),
    });
  };

  return (
    <FormModal onClose={onClose} open={open} title={title}>
      <Form
        enableReinitialize
        formType={FORM_TYPES.EDIT_FORM}
        initialValues={initialValues}
        onSubmit={onSubmit}
        render={({ submitForm }) => (
          <>
            <Fieldset>
              {fields.map(field => renderFieldForDefinition(field, { disabled: isPending }))}
            </Fieldset>
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
