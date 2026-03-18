import React from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import * as yup from 'yup';

import { FORM_TYPES } from '@tamanu/constants/forms';
import { Form, ModalContent } from '@tamanu/ui-components';
import { Button, FormModal, OutlinedButton, TranslatedText } from '../../../components';
import { useRoleCreateMutation } from './useRoleCreateMutation';
import { RequiredTextField } from './RolesAndDesignationsAdminView';

const CREATE_ROLE_VALIDATION = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />),
  id: yup
    .string()
    .trim()
    .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />),
});

const StyledFormModal = styled(FormModal)`
  ${ModalContent} {
    padding-block: 32px 0;
    padding-inline: 0;
    form > * {
      padding-inline: 32px;
    }
  }
`;

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
  justify-content: end;
  margin-block-start: 32px;
  padding-block: 20px;
`;

export const AddRoleModal = ({ open, onClose, onSuccess }) => {
  const { isLoading, mutateAsync: createRole } = useRoleCreateMutation({
    onSuccess: () => {
      onClose?.();
      onSuccess?.();
      toast.success(<TranslatedText stringId="admin.roles.add.success" fallback="Role created" />);
    },
    onError: error => {
      toast.error(
        error.message || (
          <TranslatedText stringId="admin.roles.add.error" fallback="Couldn’t create role" />
        ),
      );
    },
  });

  const renderForm = ({ submitForm }) => (
    <>
      <Fieldset disabled={isLoading}>
        <RequiredTextField
          inputProps={{ minLength: 1, maxLength: 255 }}
          label={<TranslatedText stringId="admin.roles.name.label" fallback="Name" />}
          name="name"
        />
        <RequiredTextField
          inputProps={{ minLength: 1, maxLength: 255 }}
          label={<TranslatedText stringId="admin.roles.id.label" fallback="ID" />}
          name="id"
        />
      </Fieldset>
      <Footer>
        <Button isSubmitting={isLoading} onClick={submitForm}>
          <TranslatedText stringId="general.action.add-role" fallback="Add role" />
        </Button>
        <OutlinedButton onClick={onClose} disabled={isLoading}>
          <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
        </OutlinedButton>
      </Footer>
    </>
  );

  return (
    <StyledFormModal
      title={<TranslatedText stringId="admin.roles.add.title" fallback="Add role" />}
      open={open}
      onClose={onClose}
    >
      <Form
        formType={FORM_TYPES.CREATE_FORM}
        // Passing `createRole` works; but Form.jsx can’t detect that UseMutateAsyncFunction
        // is async. This suppresses the non-async-onSubmit dev warning.
        onSubmit={async values => await createRole(values)}
        render={renderForm}
        validationSchema={CREATE_ROLE_VALIDATION}
      />
    </StyledFormModal>
  );
};
