import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react';
import { Box, TextField } from '@mui/material';

interface VerificationCodeInputProps {
  length?: number;
  onComplete?: (code: string) => void;
  onChange?: (code: string) => void;
  name?: string;
}

export const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  length = 6,
  onComplete,
  onChange,
  name = 'verificationCode'
}) => {
  const [values, setValues] = useState<string[]>(new Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus the first field on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newValues = [...values];
    newValues[index] = value;
    setValues(newValues);

    const code = newValues.join('');
    onChange?.(code);

    // Auto-advance to next field when a digit is entered
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (code.length === length && code.replace(/\s/g, '').length === length) {
      onComplete?.(code);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (values[index]) {
        // If current field has a value, clear it
        const newValues = [...values];
        newValues[index] = '';
        setValues(newValues);
        onChange?.(newValues.join(''));
      } else if (index > 0) {
        // If current field is empty, move to previous field and clear it
        const newValues = [...values];
        newValues[index - 1] = '';
        setValues(newValues);
        onChange?.(newValues.join(''));
        inputRefs.current[index - 1]?.focus();
      }
      return;
    }
    
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // If a digit is typed and current field has a value, replace it
    if (/^\d$/.test(e.key) && values[index]) {
      const newValues = [...values];
      newValues[index] = e.key;
      setValues(newValues);
      onChange?.(newValues.join(''));
      
      // Move to next field if not the last one
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
      e.preventDefault();
    }
  };

  const handleFocus = (index: number) => {
    // Select all text when focusing on a field that has content
    if (values[index]) {
      inputRefs.current[index]?.select();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, length);
    const newValues = pasteData.split('').concat(new Array(length).fill('')).slice(0, length);
    setValues(newValues);
    
    const code = newValues.join('');
    onChange?.(code);
    
    if (code.length === length) {
      onComplete?.(code);
      inputRefs.current[length - 1]?.focus();
    } else {
      inputRefs.current[pasteData.length]?.focus();
    }
  };

  return (
    <>
      <Box display="flex" gap={1} justifyContent="center" mb={2}>
        {values.map((value, index) => (
          <TextField
            key={index}
            inputRef={(el) => (inputRefs.current[index] = el)}
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
              }
            }}
            sx={{
              width: 56,
              '& .MuiOutlinedInput-root': {
                height: 56,
              }
            }}
          />
        ))}
      </Box>
      <input
        type="hidden"
        name={name}
        value={values.join('')}
      />
    </>
  );
};
