import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import {
  Field,
  Form,
  TextField,
  AutocompleteField,
  MultiAutocompleteField,
} from '../../../components/Field';
import { useSuggester } from '../../../api';
import { FormGrid, TranslatedText, FormModal, Button, OutlinedButton } from '../../../components';
import { Colors, FORM_TYPES } from '../../../constants';
import { Box } from '@mui/material';
import { useCreateUserMutation } from '../../../api/mutations';
import { toast } from 'react-toastify';
import { useTranslation } from '../../../contexts/Translation';
import { useAuth } from '../../../contexts/Auth';

const StyledFormModal = styled(FormModal)`
  .MuiPaper-root {
    max-width: 800px;
  }
`;

const Container = styled(Box)`
  padding: 16px 0px 20px;
`;

const SectionContainer = styled(Box)`
  grid-column: span 2;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
`;

const SectionTitle = styled(Box)`
  font-size: 18px;
  font-weight: 500;
  line-height: 24px;
  color: ${Colors.darkestText};
  margin: 0;
`;

const SectionSubtitle = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.midText};
`;

const CREATE_VALIDATION = yup
  .object()
  .shape({
    displayName: yup.string().trim().required(),
    displayId: yup.string().trim().nullable().optional(),
    role: yup.string().required(),
    phoneNumber: yup.string().trim().nullable().optional(),
    email: yup.string().trim().email('Must be a valid email').required(),
    designations: yup.array().of(yup.string()).nullable().optional(),
    newPassword: yup.string().required(),
    confirmPassword: yup.string().required(),
  })
  .test('passwords-match', 'Passwords must match', function (value) {
    const { newPassword, confirmPassword } = value;
    // If both passwords are provided, they must match
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return this.createError({ 
        message: 'Passwords must match', 
        path: 'confirmPassword' 
      });
    }
    // If only one password is provided, it's an error
    if ((newPassword && !confirmPassword) || (!newPassword && confirmPassword)) {
      return this.createError({ 
        message: 'Both password fields must be filled', 
        path: 'confirmPassword' 
      });
    }
    return true;
  });

export const AddUserModal = ({ open, onClose, handleRefresh }) => {
  const { mutate: createUser, isPending } = useCreateUserMutation();
  const { getTranslation } = useTranslation();
  const { ability } = useAuth();
  const canCreateUser = ability.can('create', 'User');

  const roleSuggester = useSuggester('role');
  const designationSuggester = useSuggester('designation');

  const handleSubmit = async (values) => {
    // Transform the payload to match API expectations
    const payload = {
      ...values,
      designations: values.designations || [],
      visibilityStatus: VISIBILITY_STATUSES.CURRENT, // New users are active by default
    };

    // Remove confirm password and rename newPassword to password
    delete payload.confirmPassword;
    if (payload.newPassword) {
      payload.password = payload.newPassword;
      delete payload.newPassword;
    }

    createUser(
      payload,
      {
        onSuccess: () => {
          handleRefresh();
          toast.success(
            getTranslation('admin.users.add.success', 'User created successfully!'),
          );
          onClose();
        },
        onError: error => {
          toast.error(error.message || 'Failed to create user');
        },
      },
    );
  };

  const initialValues = {
    displayName: '',
    displayId: '',
    role: '',
    designations: [],
    email: '',
    phoneNumber: '',
    newPassword: '',
    confirmPassword: '',
  };

  if (!canCreateUser) {
    return null;
  }

  return (
    <StyledFormModal
      title={<TranslatedText stringId="admin.users.add.title" fallback="Add user" />}
      open={open}
      onClose={onClose}
    >
      <Form
        suppressErrorDialog
        initialValues={initialValues}
        validationSchema={CREATE_VALIDATION}
        onSubmit={handleSubmit}
        formType={FORM_TYPES.CREATE_FORM}
        render={({ submitForm, isValid, dirty }) => {
          const allowSave = isValid && dirty && canCreateUser && !isPending;
          return (
            <>
              <Container>
                <SectionContainer>
                  <SectionTitle>
                    <TranslatedText
                      stringId="admin.users.add.details.title"
                      fallback="User details"
                    />
                  </SectionTitle>
                  <SectionSubtitle>
                    <TranslatedText
                      stringId="admin.users.add.details.subtitle"
                      fallback="Add user details below and click confirm to create a new user."
                    />
                  </SectionSubtitle>
                </SectionContainer>
                
                <FormGrid columns={2} nested>
                  <Field
                    name="displayName"
                    label={
                      <TranslatedText
                        stringId="admin.users.displayName.label"
                        fallback="Display name"
                      />
                    }
                    component={TextField}
                    required
                  />
                  <Field
                    name="displayId"
                    label={<TranslatedText stringId="admin.users.displayId.label" fallback="ID" />}
                    component={TextField}
                  />
                  <Field
                    name="role"
                    label={<TranslatedText stringId="admin.users.role.label" fallback="Role" />}
                    component={AutocompleteField}
                    suggester={roleSuggester}
                    required
                  />
                  <Field
                    name="designations"
                    label={
                      <TranslatedText
                        stringId="admin.users.designation.label"
                        fallback="Designation"
                      />
                    }
                    component={MultiAutocompleteField}
                    suggester={designationSuggester}
                  />
                  <Field
                    name="email"
                    label={<TranslatedText stringId="admin.users.email.label" fallback="Email" />}
                    component={TextField}
                    required
                  />
                  <Field
                    name="phoneNumber"
                    label={
                      <TranslatedText stringId="admin.users.phoneNumber.label" fallback="Phone" />
                    }
                    component={TextField}
                  />
                  <Field
                    name="newPassword"
                    label={
                      <TranslatedText
                        stringId="admin.users.password.label"
                        fallback="Password"
                      />
                    }
                    placeholder={getTranslation(
                      'admin.users.password.placeholder',
                      'Enter password',
                    )}
                    component={TextField}
                    type="password"
                    autoComplete="new-password"
                    required
                  />
                  <Field
                    name="confirmPassword"
                    label={
                      <TranslatedText
                        stringId="admin.users.confirmPassword.label"
                        fallback="Confirm password"
                      />
                    }
                    placeholder={getTranslation(
                      'admin.users.confirmPassword.placeholder',
                      'Confirm password',
                    )}
                    component={TextField}
                    type="password"
                    required
                  />
                </FormGrid>
              </Container>
              {/** Add a divider */}
              <Box sx={{ borderBottom: `1px solid ${Colors.outline}`, margin: '20px -32px 0 -32px' }} />

              <Box mt={2.5} mb={-1.5} display="flex" justifyContent="flex-end" gap="16px">
                <OutlinedButton onClick={onClose} disabled={isPending}>
                  <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                </OutlinedButton>
                <Button onClick={submitForm} disabled={!allowSave} isSubmitting={isPending}>
                  <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
                </Button>
              </Box>
            </>
          );
        }}
      />
    </StyledFormModal>
  );
};