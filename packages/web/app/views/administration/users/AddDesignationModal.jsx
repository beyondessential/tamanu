import React from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import * as yup from 'yup';

import { FORM_TYPES } from '@tamanu/constants/forms';
import { Form, ModalContent } from '@tamanu/ui-components';
import { Button, FormModal, OutlinedButton, TranslatedText } from '../../../components';
import { RequiredTextField } from './RolesAndDesignationsAdminView';
import { useDesignationCreateMutation } from './useDesignationCreateMutation';

const CREATE_DESIGNATION_VALIDATION = yup.object().shape({
  id: yup
    .string()
    .required(<TranslatedText stringId="validation.required.inline" fallback="*Required" />),
  name: yup
    .string()
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

export const AddDesignationModal = ({ open, onClose, onSuccess }) => {
  const { isLoading, mutateAsync: createDesignation } = useDesignationCreateMutation({
    onSuccess: () => {
      onClose?.();
      onSuccess?.();
      toast.success(
        <TranslatedText stringId="admin.designations.add.success" fallback="Designation created" />,
      );
    },
    onError: error => {
      toast.error(
        error.message ?? (
          <TranslatedText
            stringId="admin.designations.add.error"
            fallback="Couldn’t create designation"
          />
        ),
      );
    },
  });

  const onSubmit = async values => {
    await createDesignation({
      id: values.id.trim(),
      name: values.name.trim(),
    });
  };

  const renderForm = ({ submitForm }) => (
    <>
      <Fieldset disabled={isLoading}>
        <RequiredTextField
          inputProps={{ minLength: 1 }}
          label={<TranslatedText stringId="admin.designations.name.label" fallback="Name" />}
          name="name"
        />
        <RequiredTextField
          inputProps={{ minLength: 1, maxLength: 255 }}
          label={<TranslatedText stringId="admin.designations.id.label" fallback="ID" />}
          name="id"
        />
      </Fieldset>
      <Footer>
        <Button isSubmitting={isLoading} onClick={submitForm}>
          <TranslatedText stringId="general.action.add-designation" fallback="Add designation" />
        </Button>
        <OutlinedButton onClick={onClose} disabled={isLoading}>
          <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
        </OutlinedButton>
      </Footer>
    </>
  );

  return (
    <StyledFormModal
      title={<TranslatedText stringId="admin.designations.add.title" fallback="Add designation" />}
      open={open}
      onClose={onClose}
    >
      <Form
        formType={FORM_TYPES.CREATE_FORM}
        onSubmit={onSubmit}
        render={renderForm}
        validationSchema={CREATE_DESIGNATION_VALIDATION}
      />
    </StyledFormModal>
  );
};
