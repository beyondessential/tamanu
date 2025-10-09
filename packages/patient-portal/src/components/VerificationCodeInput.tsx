import React from 'react';
import { Box, Typography, styled } from '@mui/material';
import { OTPInput, REGEXP_ONLY_DIGITS } from 'input-otp';

interface VerificationCodeInputProps {
  length?: number;
  name?: string;
  error?: boolean;
  helperText?: React.ReactNode;
  onFocus?: () => void;
}

interface SlotBoxProps {
  isActive?: boolean;
}

const SlotBox = styled('div', {
  shouldForwardProp: prop => prop !== 'isActive' && prop !== 'hasError',
})<SlotBoxProps & { hasError?: boolean }>(({ theme, isActive, hasError }) => {
  const getBorderColor = () => {
    if (hasError) return theme.palette.error.main;
    if (isActive) return theme.palette.grey[400];
    return 'transparent';

  };
  return {
  width: 40,
  height: 50,
  background: hasError ? theme.palette.error.light : theme.palette.background.default,
  border: `1px solid ${theme.palette.background.default}`,
  borderRadius: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  fontWeight: 500,
  cursor: 'text',
  borderColor: getBorderColor(),
  };
});

export const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  length = 6,
  name = 'verificationCode',
  error = false,
  helperText,
  onFocus,
}) => {
  return (
    <Box display="flex" justifyContent="center">
      <Box
        display="flex"
        justifyContent="center"
        mb={1.5}
        width="fit-content"
        flexDirection="column"
      >
        <OTPInput
          name={name}
          maxLength={length}
          inputMode="numeric"
          onFocus={onFocus}
          pattern={REGEXP_ONLY_DIGITS}
          render={({ slots }) => (
            <Box display="flex" gap={0.5}>
              {slots.map((slot, idx) => (
                <SlotBox key={idx} isActive={slot.isActive} hasError={error}>
                  {slot.char ?? ' '}
                </SlotBox>
              ))}
            </Box>
          )}
        />
        <Typography variant="body2" color={error ? 'error' : 'text.secondary'} textAlign="left">
          {helperText}
        </Typography>
      </Box>
    </Box>
  );
};
