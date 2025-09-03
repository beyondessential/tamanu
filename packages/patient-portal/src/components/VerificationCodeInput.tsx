import React, {
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  ChangeEvent,
  useMemo,
  useCallback,
} from 'react';
import { Box, styled, TextField } from '@mui/material';

interface VerificationCodeInputProps {
  length?: number;
  name?: string;
}

const SingleNumberInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    background: theme.palette.background.default,
    width: 40,
    height: 50,
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      border: `1px solid ${theme.palette.grey[300]}`,
    },
  },
}));

const ALLOWED_KEYS = new Set<string>([
  'Delete',
  'Tab',
  'Escape',
  'Enter',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
]);

const validateSingleDigit = (value: string) => {
  return /^\d$/.test(value);
};

export const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  length = 6,
  name = 'verificationCode',
}) => {
  const [values, setValues] = useState<string[]>(new Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const joinedValue = useMemo(() => values.join(''), [values]);

  const updateValueAtIndex = useCallback(
    (index: number, newValue: string) => {
      if (index >= length || index < 0) return;
      setValues(prevValues => {
        const newValues = [...prevValues];
        newValues[index] = newValue;
        return newValues;
      });
    },
    [length],
  );

  const focusFieldAtIndex = useCallback((index: number) => {
    inputRefs.current[index]?.focus();
  }, []);
  const incrementFocusedField = useCallback(
    (index: number) => {
      const nextIndex = index + 1;
      if (nextIndex >= length) return;
      focusFieldAtIndex(nextIndex);
    },
    [length, focusFieldAtIndex],
  );
  const decrementFocusedField = useCallback(
    (index: number) => {
      const prevIndex = index - 1;
      if (prevIndex < 0) return;
      focusFieldAtIndex(prevIndex);
    },
    [focusFieldAtIndex],
  );

  // Auto-focus the first field on mount
  useEffect(() => {
    focusFieldAtIndex(0);
  }, [focusFieldAtIndex]);

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (value === '') {
        updateValueAtIndex(index, '');
        return;
      }
      if (validateSingleDigit(value)) {
        updateValueAtIndex(index, value);
        // Auto-advance to next field when a digit is entered
        incrementFocusedField(index);
      }
    },
    [updateValueAtIndex, incrementFocusedField],
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      // Check if the key is a control key for paste
      const isMetaKey = e.ctrlKey || e.metaKey;

      // Allow other control keys
      if (ALLOWED_KEYS.has(e.key) || isMetaKey) {
        return;
      }

      if (e.key === 'Backspace') {
        if (values[index]) {
          // If current field has a value, clear it
          updateValueAtIndex(index, '');
          return;
        }
        // If current field is empty, move to previous field and clear it
        updateValueAtIndex(index - 1, '');
        decrementFocusedField(index);
      }
      if (e.key === 'ArrowLeft') {
        decrementFocusedField(index);
        return;
      }
      if (e.key === 'ArrowRight') {
        incrementFocusedField(index);
        return;
      }

      handleChange(index, e.key);
      e.preventDefault();
    },
    [values, updateValueAtIndex, decrementFocusedField, incrementFocusedField, handleChange],
  );

  const handlePaste = useCallback(
    (index: number, e: React.ClipboardEvent) => {
      e.preventDefault();
      const digits = e.clipboardData.getData('text').replace(/\D/g, '');
      if (!digits) return;

      const toWriteLength = Math.min(digits.length, length - index);
      setValues(prev => {
        const next = [...prev];
        for (let i = 0; i < toWriteLength; i += 1) {
          next[index + i] = digits[i];
        }
        return next;
      });

      const nextFocusIndex = Math.min(index + toWriteLength, length - 1);
      focusFieldAtIndex(nextFocusIndex);
    },
    [length, focusFieldAtIndex],
  );

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
            onPaste={e => handlePaste(index, e)}
            slotProps={{
              input: {
                inputProps: {
                  maxLength: 1,
                },
                style: {
                  textAlign: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                },
              },
            }}
          />
        ))}
      </Box>
      <input type="hidden" name={name} value={joinedValue} />
    </>
  );
};
