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

const EDIT_MODAL_CONFIG = /** @type {const} */ ({
  programRegistryClinicalStatus: {
    title: 'Edit status',
    showColor: true,
  },
  programRegistryCondition: {
    title: 'Edit condition',
    showColor: false,
  },
  programRegistryConditionCategory: {
    title: 'Edit condition category',
    showColor: false,
  },
});

const visibilityStatusValues = visibilityStatusSelectOptions.map(option => option.value);

function buildValidationSchema(showColor) {
  const shape = {
    code: yup.string(),
    name: yup.string().trim().required('Required'),
    visibilityStatus: yup.string().required('Required').oneOf(visibilityStatusValues),
  };
  if (showColor) {
    shape.color = yup.string().nullable();
  }
  return yup.object().shape(shape);
}

/**
 * @param {{
 *   open: boolean;
 *   onClose: () => void;
 *   onSaved?: () => void;
 *   resourceSegment: keyof typeof EDIT_MODAL_CONFIG;
 *   record: { id: string; code: string; name: string; visibilityStatus: string; color?: string | null };
 * }} props
 */
export function EditProgramRegistryTableRecordModal({
  open,
  onClose,
  onSaved,
  resourceSegment,
  record,
}) {
  const api = useApi();
  const { title, showColor } = EDIT_MODAL_CONFIG[resourceSegment];

  const validationSchema = useMemo(() => buildValidationSchema(showColor), [showColor]);

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ['admin', 'programRegistrySubResource', 'patch', resourceSegment],
    mutationFn: async body =>
      await api.patch(`admin/${resourceSegment}/${encodeURIComponent(record.id)}`, body),
    onSuccess: () => {
      notifySuccess(
        <TranslatedText
          stringId="admin.programRegistries.table.recordUpdateSuccess"
          fallback="Record updated"
        />,
      );
      onSaved?.();
      onClose();
    },
    onError: err => notifyError(err?.message),
  });

  const initialValues = useMemo(
    () => ({
      code: record.code ?? '',
      name: record.name ?? '',
      visibilityStatus: record.visibilityStatus ?? '',
      ...(showColor ? { color: record.color ?? '' } : {}),
    }),
    [record.code, record.color, record.name, record.visibilityStatus, showColor],
  );

  return (
    <FormModal onClose={onClose} open={open} title={title}>
      <Form
        enableReinitialize
        formType={FORM_TYPES.EDIT_FORM}
        initialValues={initialValues}
        onSubmit={async values => {
          const payload = {
            name: values.name,
            visibilityStatus: values.visibilityStatus,
          };
          if (showColor) {
            payload.color = values.color?.trim() ? values.color.trim() : null;
          }
          await mutateAsync(payload);
        }}
        render={({ submitForm }) => (
          <>
            <Fieldset>
              <Field name="code" component={ReadOnlyTextField} label="code" />
              <Field name="name" component={TextField} disabled={isPending} label="name" />
              {showColor ? (
                <Field name="color" component={TextField} disabled={isPending} label="color" />
              ) : null}
              <VisibilityStatusSelectField
                disabled={isPending}
                label="visibilityStatus"
                name="visibilityStatus"
              />
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
