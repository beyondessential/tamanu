import React, { useState, useMemo } from 'react';
import { Box, styled } from '@mui/material';
import { OTPInput, REGEXP_ONLY_DIGITS } from 'input-otp';

interface VerificationCodeInputProps {
  length?: number;
  name?: string;
}

const SlotBox = styled('div')(({ theme }) => ({
  width: 40,
  height: 50,
  background: theme.palette.background.default,
  border: `1px solid ${theme.palette.background.default}`,
  borderRadius: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  cursor: 'text',
  userSelect: 'none',
  '&[data-active="true"]': {
    borderColor: theme.palette.grey[400],
  },
}));

export const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  length = 6,
  name = 'verificationCode',
}) => {
  const [value, setValue] = useState('');

  const joinedValue = useMemo(() => value.slice(0, length), [value, length]);

  return (
    <>
      <Box display="flex" justifyContent="center" mb={2}>
        <OTPInput
          maxLength={length}
          value={joinedValue}
          onChange={setValue}
          inputMode="numeric"
          pattern={REGEXP_ONLY_DIGITS}
          render={({ slots }) => (
            <Box display="flex" gap={1}>
              {slots.map((slot, idx) => (
                <SlotBox key={idx} data-active={slot.isActive ? 'true' : undefined}>
                  {slot.char ?? ' '}
                </SlotBox>
              ))}
            </Box>
          )}
        />
      </Box>
      <input type="hidden" name={name} value={joinedValue} />
    </>
  );
};
