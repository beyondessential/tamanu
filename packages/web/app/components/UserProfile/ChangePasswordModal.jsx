import React, { useState } from 'react';
import styled from 'styled-components';
import { Box, Button, Typography } from '@material-ui/core';
import * as yup from 'yup';

import { useApi } from '../../api';
import { Modal } from '../Modal';
import { Form, Field, TextField } from '../Field';
import { FormGrid } from '../FormGrid';
import { TranslatedText } from '../Translation/TranslatedText';
import { notifySuccess, notifyError } from '../../utils';
import { Colors } from '../../constants';

const passwordSchema = yup.object().shape({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required'),
  confirmPassword: yup
    .string()
    .required('Password confirmation is required')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

const PasswordStrengthIndicator = styled.div`
  margin-top: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: ${props => {
    switch (props.strength) {
      case 'weak': return '#ffebee';
      case 'medium': return '#fff3e0';
      case 'strong': return '#e8f5e8';
      default: return 'transparent';
    }
  }};
  color: ${props => {
    switch (props.strength) {
      case 'weak': return '#c62828';
      case 'medium': return '#ef6c00';
      case 'strong': return '#2e7d32';
      default: return Colors.text;
    }
  }};
  font-size: 0.875rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
`;

const getPasswordStrength = (password) => {
  if (!password) return null;
  
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLongEnough = password.length >= 8;
  
  const criteriaCount = [hasLower, hasUpper, hasNumber, hasSpecial, isLongEnough].filter(Boolean).length;
  
  if (criteriaCount < 3) return 'weak';
  if (criteriaCount < 5) return 'medium';
  return 'strong';
};

const getPasswordStrengthText = (strength) => {
  switch (strength) {
    case 'weak': return 'Weak password';
    case 'medium': return 'Medium strength password';
    case 'strong': return 'Strong password';
    default: return '';
  }
};

export const ChangePasswordModal = ({ open, onClose }) => {
  const api = useApi();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      await api.changePasswordAuthenticated(values);
      notifySuccess('Password changed successfully');
      onClose();
    } catch (error) {
      const message = error.message || 'Failed to change password. Please try again.';
      notifyError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = (value) => {
    setPasswordStrength(getPasswordStrength(value));
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
          
          {passwordStrength && (
            <PasswordStrengthIndicator strength={passwordStrength} data-testid="password-strength-indicator">
              <TranslatedText
                stringId={`userProfile.changePassword.strength.${passwordStrength}`}
                fallback={getPasswordStrengthText(passwordStrength)}
                data-testid="translatedtext-password-strength"
              />
            </PasswordStrengthIndicator>
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

        <Box mt={2} data-testid="box-password-requirements">
          <Typography variant="body2" color="textSecondary" data-testid="typography-requirements-title">
            <TranslatedText
              stringId="userProfile.changePassword.requirements.title"
              fallback="Password Requirements:"
              data-testid="translatedtext-requirements-title"
            />
          </Typography>
          <Typography variant="body2" color="textSecondary" data-testid="typography-requirements-list">
            <TranslatedText
              stringId="userProfile.changePassword.requirements.list"
              fallback="• At least 8 characters long • Include uppercase and lowercase letters • Include at least one number • Include at least one special character"
              data-testid="translatedtext-requirements-list"
            />
          </Typography>
        </Box>

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