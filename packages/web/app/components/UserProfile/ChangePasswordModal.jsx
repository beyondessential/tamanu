import React, { useState } from 'react';
import styled from 'styled-components';
import { Button } from '@material-ui/core';
import * as yup from 'yup';

import { useApi } from '../../api';
import { Modal } from '../Modal';
import { Form, Field, TextField } from '../Field';
import { FormGrid } from '../FormGrid';
import { TranslatedText } from '../Translation/TranslatedText';
import { notifySuccess, notifyError } from '../../utils';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { validatePasswordStrength } from '../../utils/passwordValidation';

const passwordSchema = yup.object().shape({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required')
    .test('password-strength', 'Password does not meet security requirements', function(value) {
      if (!value) return false;
      const validation = validatePasswordStrength(value);
      return validation.isValid;
    }),
  confirmPassword: yup
    .string()
    .required('Password confirmation is required')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});



const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;



export const ChangePasswordModal = ({ open, onClose, onSuccess }) => {
  const api = useApi();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      await api.changePasswordAuthenticated(values);
      notifySuccess('Password changed successfully');
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (error) {
      const message = error.message || 'Failed to change password. Please try again.';
      notifyError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = (value) => {
    setNewPassword(value);
  };

  return (
    <Modal
      width="md"
      title={
        <TranslatedText
          stringId="userProfile.changePassword.modal.title"
          fallback="Change Password"
          data-testid="translatedtext-modal-title"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="modal-change-password"
    >
      <Form
        onSubmit={handleSubmit}
        validationSchema={passwordSchema}
        initialValues={{
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }}
        data-testid="form-change-password"
      >
        <FormGrid data-testid="formgrid-password-fields">
          <Field
            name="currentPassword"
            label={
              <TranslatedText
                stringId="userProfile.changePassword.field.currentPassword.label"
                fallback="Current Password"
                data-testid="translatedtext-current-password-label"
              />
            }
            component={TextField}
            type="password"
            required
            data-testid="field-current-password"
          />
          
          <Field
            name="newPassword"
            label={
              <TranslatedText
                stringId="userProfile.changePassword.field.newPassword.label"
                fallback="New Password"
                data-testid="translatedtext-new-password-label"
              />
            }
            component={TextField}
            type="password"
            required
            onChange={handlePasswordChange}
            data-testid="field-new-password"
          />
          
          {newPassword && (
            <PasswordStrengthIndicator 
              password={newPassword} 
              showRequirements={true}
              data-testid="password-strength-indicator"
            />
          )}
          
          <Field
            name="confirmPassword"
            label={
              <TranslatedText
                stringId="userProfile.changePassword.field.confirmPassword.label"
                fallback="Confirm New Password"
                data-testid="translatedtext-confirm-password-label"
              />
            }
            component={TextField}
            type="password"
            required
            data-testid="field-confirm-password"
          />
        </FormGrid>



        <ActionButtons data-testid="action-buttons">
          <Button
            onClick={onClose}
            disabled={isSubmitting}
            data-testid="button-cancel"
          >
            <TranslatedText
              stringId="general.action.cancel"
              fallback="Cancel"
              data-testid="translatedtext-cancel"
            />
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting}
            data-testid="button-change-password"
          >
            {isSubmitting ? (
              <TranslatedText
                stringId="userProfile.changePassword.action.changing"
                fallback="Changing..."
                data-testid="translatedtext-changing"
              />
            ) : (
              <TranslatedText
                stringId="userProfile.changePassword.action.change"
                fallback="Change Password"
                data-testid="translatedtext-change"
              />
            )}
          </Button>
        </ActionButtons>
      </Form>
    </Modal>
  );
};