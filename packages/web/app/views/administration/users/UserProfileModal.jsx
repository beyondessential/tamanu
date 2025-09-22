import React, { useMemo } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import {
  Field,
  Form,
  TextField,
  AutocompleteField,
  MultiAutocompleteField,
  SelectField,
} from '../../../components/Field';
import { useSuggester } from '../../../api';
import { FormGrid, TranslatedText, FormModal, Button, OutlinedButton } from '../../../components';
import { Colors, FORM_TYPES } from '../../../constants';
import { Box, Divider } from '@mui/material';
import { foreignKey } from '../../../utils/validation';
import { useUpdateUserMutation } from '../../../api/mutations';
import { toast } from 'react-toastify';
import { useTranslation } from '../../../contexts/Translation';
import { UserLeaveSection } from './UserLeaveSection';
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
  grid-column: span 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
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

const validationSchema = yup.object().shape({
  visibilityStatus: foreignKey(
    <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
  ).oneOf([VISIBILITY_STATUSES.CURRENT, VISIBILITY_STATUSES.HISTORICAL]),
  displayName: foreignKey(
    <TranslatedText stringId="validation.required.inline" fallback="*Required" />,
  ),
  role: foreignKey(<TranslatedText stringId="validation.required.inline" fallback="*Required" />),
  email: foreignKey(<TranslatedText stringId="validation.required.inline" fallback="*Required" />)
    .email()
    .translatedLabel(<TranslatedText stringId="admin.users.email.label" fallback="Email" />),
  newPassword: yup.string().nullable(),
  confirmPassword: yup
    .string()
    .nullable()
    .test(
      'passwords-match',
      <TranslatedText stringId="validation.passwords.mismatch" fallback="Passwords don't match" />,
      function(value) {
        const { newPassword } = this.parent;
        // Only validate if both passwords are provided
        if (!newPassword && !value) return true;
        if (newPassword && !value) return false;
        if (!newPassword && value) return false;
        return newPassword === value;
      },
    ),
});

export const UserProfileModal = ({ open, onClose, user, handleRefresh }) => {
  const { mutate: updateUser } = useUpdateUserMutation(user.id);
  const { getTranslation } = useTranslation();
  const { ability } = useAuth();
  const canUpdateUser = ability.can(
    'write',
    new (function User() {
      this.id = user.id;
    })(),
  );

  const roleSuggester = useSuggester('role');
  const designationSuggester = useSuggester('designation');
  const facilitySuggester = useSuggester('facility', { baseQueryParameters: { noLimit: true } });

  const statusOptions = [
    {
      value: VISIBILITY_STATUSES.CURRENT,
      label: <TranslatedText stringId="admin.users.status.active" fallback="Active" />,
    },
    {
      value: VISIBILITY_STATUSES.HISTORICAL,
      label: <TranslatedText stringId="admin.users.status.deactivated" fallback="Deactivated" />,
    },
  ];

  const handleSubmit = async values => {
    updateUser(values, {
      onSuccess: () => {
        handleRefresh();
        if (values.newPassword && values.confirmPassword) {
          toast.success(
            getTranslation(
              'admin.users.profile.successWithPassword',
              'User updated successfully! Password changed.',
            ),
          );
        } else {
          toast.success(
            getTranslation('admin.users.profile.success', 'User updated successfully!'),
          );
        }
        onClose();
      },
      onError: error => {
        toast.error(error.message);
      },
    });
  };

  const initialValues = useMemo(() => {
    return {
      visibilityStatus: user?.visibilityStatus,
      displayName: user?.displayName,
      displayId: user?.displayId,
      role: user?.role,
      designations: user?.designations?.map(d => d.designationId) || [],
      email: user?.email,
      phoneNumber: user?.phoneNumber,
      newPassword: '',
      confirmPassword: '',
      allowedFacilityIds: user?.facilities?.map(f => f.id) || [],
    };
  }, [user]);

  return (
    <StyledFormModal
      title={<TranslatedText stringId="admin.users.profile.title" fallback="User profile" />}
      open={open}
      onClose={onClose}
    >
      <Form
        suppressErrorDialog
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        formType={FORM_TYPES.EDIT_FORM}
        enableReinitialize
        render={({ submitForm, dirty }) => {
          const allowSave = dirty && canUpdateUser;
          return (
            <>
              <Container>
                <FormGrid columns={2} nested>
                  <SectionContainer>
                    <SectionTitle>
                      <TranslatedText
                        stringId="admin.users.details.title"
                        fallback="User details"
                      />
                    </SectionTitle>
                    <SectionSubtitle>
                      <TranslatedText
                        stringId="admin.users.details.subtitle"
                        fallback="Edit user details below."
                      />
                    </SectionSubtitle>
                  </SectionContainer>

                  <Field
                    name="visibilityStatus"
                    label={<TranslatedText stringId="admin.users.status.label" fallback="Status" />}
                    component={SelectField}
                    options={statusOptions}
                    isClearable={false}
                    required
                    disabled={!canUpdateUser}
                  />
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
                    disabled={!canUpdateUser}
                  />
                  <Field
                    name="displayId"
                    label={<TranslatedText stringId="admin.users.displayId.label" fallback="ID" />}
                    component={TextField}
                    disabled={!canUpdateUser}
                  />
                  <Field
                    name="role"
                    label={<TranslatedText stringId="admin.users.role.label" fallback="Role" />}
                    component={AutocompleteField}
                    suggester={roleSuggester}
                    required
                    disabled={!canUpdateUser}
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
                    disabled={!canUpdateUser}
                  />
                  <Field
                    name="email"
                    label={<TranslatedText stringId="admin.users.email.label" fallback="Email" />}
                    component={TextField}
                    required
                    disabled={!canUpdateUser}
                  />
                  <Field
                    name="phoneNumber"
                    label={
                      <TranslatedText stringId="admin.users.phoneNumber.label" fallback="Phone" />
                    }
                    component={TextField}
                    disabled={!canUpdateUser}
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
                    allowSelectAll
                    suggester={facilitySuggester}
                    style={{ gridColumn: 'span 2' }}
                  />
                </FormGrid>
                {canUpdateUser && (
                  <>
                    <Divider sx={{ borderColor: Colors.outline, margin: '20px 0' }} />
                    <FormGrid columns={2} nested>
                      <SectionContainer gridColumn="span 2">
                        <SectionTitle>
                          <TranslatedText
                            stringId="admin.users.changePassword.title"
                            fallback="Change password"
                          />
                        </SectionTitle>
                        <SectionSubtitle>
                          <TranslatedText
                            stringId="admin.users.changePassword.subtitle"
                            fallback="Use the fields below to reset the users password."
                          />
                        </SectionSubtitle>
                      </SectionContainer>
                      <Field
                        name="newPassword"
                        label={
                          <TranslatedText
                            stringId="admin.users.newPassword.label"
                            fallback="New password"
                          />
                        }
                        placeholder={getTranslation(
                          'admin.users.newPassword.placeholder',
                          'Enter new password',
                        )}
                        component={TextField}
                        type="password"
                        required
                        autoComplete="new-password"
                      />
                      <Field
                        name="confirmPassword"
                        label={
                          <TranslatedText
                            stringId="admin.users.confirmNewPassword.label"
                            fallback="Confirm new password"
                          />
                        }
                        placeholder={getTranslation(
                          'admin.users.confirmNewPassword.placeholder',
                          'Confirm new password',
                        )}
                        component={TextField}
                        type="password"
                        required
                      />
                    </FormGrid>
                  </>
                )}
              </Container>

              <Divider sx={{ borderColor: Colors.outline }} />
              <UserLeaveSection user={user} />
              <Box mt="34px">
                <Divider sx={{ borderColor: Colors.outline }} />
              </Box>
              <Box mt={2.5} mb={-1.5} display="flex" justifyContent="flex-end" gap="16px">
                {allowSave ? (
                  <>
                    <OutlinedButton onClick={onClose}>
                      <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                    </OutlinedButton>
                    <Button onClick={submitForm}>
                      <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
                    </Button>
                  </>
                ) : (
                  <Button onClick={onClose} style={{ height: '41px' }}>
                    <TranslatedText stringId="general.action.close" fallback="Close" />
                  </Button>
                )}
              </Box>
            </>
          );
        }}
      />
    </StyledFormModal>
  );
};
