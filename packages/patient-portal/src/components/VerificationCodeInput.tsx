import React from 'react';
import { Box, Typography, styled } from '@mui/material';
import { OTPInput, REGEXP_ONLY_DIGITS } from 'input-otp';

interface VerificationCodeInputProps {
  length?: number;
  name?: string;
  error?: boolean;
  helperText?: React.ReactNode;
}

interface SlotBoxProps {
  isActive?: boolean;
}

const SlotBox = styled('div', {
  shouldForwardProp: prop => prop !== 'isActive' && prop !== 'hasError',
})<SlotBoxProps & { hasError?: boolean }>(
  ({ theme, isActive, hasError }) => ({
    width: 40,
    height: 50,
    background: theme.palette.background.default,
    border: `1px solid ${theme.palette.background.default}`,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    fontWeight: 500,
    cursor: 'text',
    borderColor: hasError
      ? theme.palette.error.main
      : isActive
        ? theme.palette.grey[400]
        : undefined,
  }),
);

export const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  length = 6,
  name = 'verificationCode',
  error = false,
  helperText,
}) => {
  return (
    <Box>
      <Box display="flex" justifyContent="center" mb={1.5}>
        <OTPInput
          name={name}
          maxLength={length}
          inputMode="numeric"
          pattern={REGEXP_ONLY_DIGITS}
          render={({ slots }) => (
            <Box display="flex" gap={1}>
              {slots.map((slot, idx) => (
                <SlotBox key={idx} isActive={slot.isActive} hasError={error}>
                  {slot.char ?? ' '}
                </SlotBox>
              ))}
            </Box>
          )}
        />
      </Box>
      {helperText ? (
        <Typography variant="body2" color={error ? 'error' : 'text.secondary'} textAlign="center">
          {helperText}
        </Typography>
      ) : null}
    </Box>
  );
};
