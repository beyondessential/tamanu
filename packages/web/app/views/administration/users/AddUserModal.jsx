import React from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import {
  Field,
  TextField,
  AutocompleteField,
  MultiAutocompleteField,
} from '../../../components/Field';
import { useSuggester } from '../../../api';
import { TranslatedText, FormModal, Button, OutlinedButton } from '../../../components';
import { Form, FormGrid } from '@tamanu/ui-components';
import { Colors } from '../../../constants';
import { FORM_TYPES } from '@tamanu/constants';
import { Box } from '@mui/material';
import { useCreateUserMutation, useValidateUserMutation } from '../../../api/mutations';
import { toast } from 'react-toastify';
import { useTranslation } from '../../../contexts/Translation';
import { foreignKey } from '../../../utils/validation';

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

const CREATE_VALIDATION = yup.object().shape({
  displayName: foreignKey(
    <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
  ),
  role: foreignKey(<TranslatedText stringId="validation.required.inline" fallback="*Required" />),
  email: foreignKey(<TranslatedText stringId="validation.required.inline" fallback="*Required" />)
    .email()
    .translatedLabel(<TranslatedText stringId="admin.users.email.label" fallback="Email" />),
  newPassword: foreignKey(
    <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
  ),
  confirmPassword: foreignKey(
    <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
  ).test(
    'passwords-match',
    <TranslatedText stringId="validation.passwords.mismatch" fallback="Passwords don't match" />,
    function(value) {
      const { newPassword } = this.parent;
      return newPassword === value;
    },
  ),
});

export const AddUserModal = ({ open, onClose, handleRefresh }) => {
  const { mutate: createUser, isPending: isCreateUserPending } = useCreateUserMutation();
  const { mutateAsync: validateUser, isPending: isValidateUserPending } = useValidateUserMutation();
  const { getTranslation } = useTranslation();

  const isPending = isCreateUserPending || isValidateUserPending;

  const roleSuggester = useSuggester('role');
  const designationSuggester = useSuggester('designation');
  const facilitySuggester = useSuggester('facility', { baseQueryParameters: { noLimit: true } });

  const handleSubmit = async (values, { setFieldError }) => {
    const data = await validateUser(values);
    if (!data.isEmailUnique) {
      setFieldError(
        'email',
        getTranslation(
          'admin.users.add.error.email',
          'Account already exists with this email address',
        ),
      );
    }
    if (!data.isDisplayNameUnique) {
      setFieldError(
        'displayName',
        getTranslation('admin.users.add.error.displayName', 'Display name already exists'),
      );
    }
    if (!data.isEmailUnique || !data.isDisplayNameUnique) {
      return;
    }

    // Transform the payload to match API expectations
    const payload = {
      ...values,
      password: values.newPassword,
    };

    delete payload.newPassword;
    delete payload.confirmPassword;

    createUser(payload, {
      onSuccess: () => {
        handleRefresh();
        toast.success(getTranslation('admin.users.add.success', 'User created successfully!'));
        onClose();
      },
      onError: error => {
        toast.error(error.message || 'Failed to create user');
      },
    });
  };

  const initialValues = {
    displayName: '',
    displayId: '',
    role: '',
    designations: [],
    allowedFacilityIds: [],
    email: '',
    phoneNumber: '',
    newPassword: '',
    confirmPassword: '',
  };

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
        render={({ submitForm }) => {
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
                      <TranslatedText stringId="admin.users.password.label" fallback="Password" />
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
                  <Field
                    name="allowedFacilityIds"
                    label={
                      <TranslatedText
                        stringId="admin.users.allowedFacilities.label"
                        fallback="Allowed facilities"
                      />
                    }
                    component={MultiAutocompleteField}
                    suggester={facilitySuggester}
                    allowSelectAll
                    style={{ gridColumn: 'span 2' }}
                  />
                </FormGrid>
              </Container>
              {/** Add a divider */}
              <Box
                sx={{ borderBottom: `1px solid ${Colors.outline}`, margin: '20px -32px 0 -32px' }}
              />

              <Box mt={2.5} mb={-1.5} display="flex" justifyContent="flex-end" gap="16px">
                <OutlinedButton onClick={onClose} disabled={isPending}>
                  <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                </OutlinedButton>
                <Button onClick={submitForm} isSubmitting={isPending}>
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
