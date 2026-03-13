import React from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import * as yup from 'yup';

import { FORM_TYPES } from '@tamanu/constants/forms';
import { Form } from '@tamanu/ui-components';
import { Button, FormModal, OutlinedButton, TranslatedText } from '../../../components';
import { Field, TextField } from '../../../components/Field';
import { useRoleCreateMutation } from './useRoleCreateMutation';

const CREATE_ROLE_VALIDATION = yup.object().shape({
  name: yup
    .string()
    .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />),
  id: yup
    .string()
    .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />),
});

const RequiredTextField = styled(Field).attrs({
  component: TextField,
  required: true,
})``;

const Footer = styled.footer`
  display: flex;
  flex-direction: row-reverse;
`;

export const AddRoleModal = ({ open, onClose, onSuccess }) => {
  const { mutate: createRole, isPending } = useRoleCreateMutation({
    onSuccess: () => {
      onSuccess?.();
      onClose();
      toast.success(<TranslatedText stringId="admin.roles.add.success" fallback="Role created" />);
    },
    onError: error => {
      toast.error(
        error.message ?? (
          <TranslatedText stringId="admin.roles.add.error" fallback="Couldn’t create role" />
        ),
      );
    },
  });

  const onSubmit = values => {
    createRole({ id: values.id.trim(), name: values.name.trim() });
  };

  const renderForm = ({ submitForm }) => (
    <>
      <fieldset disabled={isPending}>
        <RequiredTextField
          label={<TranslatedText stringId="admin.roles.name.label" fallback="Name" />}
          name="name"
        />
        <RequiredTextField
          label={<TranslatedText stringId="admin.roles.id.label" fallback="ID" />}
          name="id"
        />
      </fieldset>
      <Footer>
        <Button onClick={submitForm} isSubmitting={isPending}>
          <TranslatedText stringId="general.action.add-role" fallback="Add role" />
        </Button>
        <OutlinedButton onClick={onClose} disabled={isPending}>
          <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
        </OutlinedButton>
      </Footer>
    </>
  );

  return (
    <FormModal
      title={<TranslatedText stringId="admin.roles.add.title" fallback="Add role" />}
      open={open}
      onClose={onClose}
    >
      <Form
        formType={FORM_TYPES.CREATE_FORM}
        onSubmit={onSubmit}
        render={renderForm}
        validationSchema={CREATE_ROLE_VALIDATION}
      />
    </FormModal>
  );
};
