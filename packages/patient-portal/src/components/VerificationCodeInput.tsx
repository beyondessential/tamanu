import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { Box, styled, TextField } from '@mui/material';

interface VerificationCodeInputProps {
  length?: number;
  name: string;
}

const SingleNumberInput = styled(TextField)({
  width: 56,
  '& .MuiOutlinedInput-root': {
    height: 56,
  },
});

export const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  length = 6,
  name = 'verificationCode',
}) => {
  const [values, setValues] = useState<string[]>(new Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const updateValueAtIndex = (index: number, newValue: string) => {
    const newValues = [...values];
    newValues[index] = newValue;
    setValues(newValues);
  };

  const incrementFocusedField = (index: number) => {
    inputRefs.current[index + 1]?.focus();
  };
  const decrementFocusedField = (index: number) => {
    inputRefs.current[index - 1]?.focus();
  };

  const validateSingleDigit = (value: string) => value && /^\d$/.test(value);

  // Auto-focus the first field on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!validateSingleDigit(value)) return;

    updateValueAtIndex(index, value);

    // Auto-advance to next field when a digit is entered
    if (value && index < length - 1) {
      incrementFocusedField(index);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Allow navigation and control keys
    const allowedKeys = ['Delete', 'Tab', 'Escape', 'Enter', 'ArrowUp', 'ArrowDown', 'Home', 'End'];

    if (e.key === 'Backspace') {
      if (values[index]) {
        // If current field has a value, clear it
        updateValueAtIndex(index, '');
      } else if (index > 0) {
        // If current field is empty, move to previous field and clear it
        updateValueAtIndex(index - 1, '');
        decrementFocusedField(index);
      }
      return;
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      decrementFocusedField(index);
      return;
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      incrementFocusedField(index);
      return;
    }
    // Allow other control keys
    if (allowedKeys.includes(e.key)) {
      return;
    }

    if (!validateSingleDigit(e.key)) {
      e.preventDefault();
      return;
    }

    updateValueAtIndex(index, e.key);

    if (index < length - 1) {
      incrementFocusedField(index);
    }
    e.preventDefault();
  };

  const handleFocus = (index: number) => {
    // Select digit when focusing on a field that has content
    if (values[index]) {
      inputRefs.current[index]?.select();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData
      .getData('text')
      .replace(/\D/g, '') // Remove all non-digits
      .slice(0, length); // Limit to field length

    const newValues = pasteData.split('').concat(new Array(length).fill('')).slice(0, length);
    setValues(newValues);

    inputRefs.current[pasteData.length]?.focus();
  };

  return (
    <>
      <Box display="flex" gap={1} justifyContent="center" mb={2}>
        {values.map((value, index) => (
          <SingleNumberInput
            key={index}
            inputRef={el => (inputRefs.current[index] = el)}
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(index, e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, e)}
            onFocus={() => handleFocus(index)}
            onPaste={handlePaste}
            inputProps={{
              maxLength: 1,
              style: {
                textAlign: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
              },
            }}
          />
        ))}
      </Box>
      <input type="hidden" name={name} value={values.join('')} />
    </>
  );
};
