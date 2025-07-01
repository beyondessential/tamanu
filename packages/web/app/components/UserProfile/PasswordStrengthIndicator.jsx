import React from 'react';
import styled from 'styled-components';
import { Typography, LinearProgress } from '@material-ui/core';
import { Check, Close } from '@material-ui/icons';

import { TranslatedText } from '../Translation/TranslatedText';
import { validatePasswordStrength, getPasswordStrengthColor } from '../../utils/passwordValidation';
import { Colors } from '../../constants';

const StrengthContainer = styled.div`
  margin-top: 0.5rem;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid ${Colors.outline};
  background-color: ${Colors.white};
`;

const StrengthHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const StrengthText = styled(Typography)`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.color || Colors.text};
`;

const ProgressBar = styled(LinearProgress)`
  height: 6px;
  border-radius: 3px;
  margin-bottom: 0.75rem;
  
  .MuiLinearProgress-bar {
    background-color: ${props => props.strengthcolor};
  }
  
  .MuiLinearProgress-colorPrimary {
    background-color: ${Colors.outline};
  }
`;

const RequirementsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const RequirementItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: ${props => props.met ? '#2e7d32' : '#666'};
`;

const RequirementIcon = styled.div`
  display: flex;
  align-items: center;
  color: ${props => props.met ? '#2e7d32' : '#c62828'};
  
  svg {
    font-size: 16px;
  }
`;

export const PasswordStrengthIndicator = ({ password, showRequirements = true }) => {
  if (!password) return null;

  const validation = validatePasswordStrength(password);
  const { strength, score } = validation;
  const strengthColor = getPasswordStrengthColor(strength);
  const progressValue = (score / 5) * 100;

  const requirements = [
    {
      text: 'At least 8 characters',
      met: password.length >= 8,
      key: 'length'
    },
    {
      text: 'Uppercase letter (A-Z)',
      met: /[A-Z]/.test(password),
      key: 'uppercase'
    },
    {
      text: 'Lowercase letter (a-z)',
      met: /[a-z]/.test(password),
      key: 'lowercase'
    },
    {
      text: 'Number (0-9)',
      met: /\d/.test(password),
      key: 'number'
    },
    {
      text: 'Special character',
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      key: 'special'
    }
  ];

  return (
    <StrengthContainer data-testid="password-strength-container">
      <StrengthHeader data-testid="strength-header">
        <StrengthText color={strengthColor} data-testid="strength-text">
          <TranslatedText
            stringId={`userProfile.changePassword.strength.${strength}`}
            fallback={strength === 'weak' ? 'Weak password' : strength === 'medium' ? 'Medium strength' : 'Strong password'}
            data-testid="translatedtext-strength"
          />
        </StrengthText>
        <Typography variant="body2" color="textSecondary" data-testid="score-text">
          {score}/5
        </Typography>
      </StrengthHeader>
      
      <ProgressBar
        variant="determinate"
        value={progressValue}
        strengthcolor={strengthColor}
        data-testid="strength-progress"
      />
      
      {showRequirements && (
        <RequirementsList data-testid="requirements-list">
          {requirements.map((requirement) => (
            <RequirementItem key={requirement.key} met={requirement.met} data-testid={`requirement-${requirement.key}`}>
              <RequirementIcon met={requirement.met} data-testid={`requirement-icon-${requirement.key}`}>
                {requirement.met ? <Check /> : <Close />}
              </RequirementIcon>
              <span data-testid={`requirement-text-${requirement.key}`}>
                {requirement.text}
              </span>
            </RequirementItem>
          ))}
        </RequirementsList>
      )}
    </StrengthContainer>
  );
};