import React from 'react';
import {
  FormControl,
  InputLabel,
  TextField as MuiTextField,
  styled,
  type TextFieldProps,
} from '@mui/material';

const StyledInputLabel = styled(InputLabel)(({ theme }) => ({
  fontSize: '14px',
  fontWeight: 500,
  '& .MuiFormLabel-asterisk': {
    color: theme.palette.error.main,
  },
}));

const StyledTextField = styled(MuiTextField)(({ theme }) => ({
  'label + &': {
    marginTop: theme.spacing(2),
  },
  '& .MuiInputBase-input:-webkit-autofill': {
    WebkitBoxShadow: '0 0 0 1000px white inset',
    WebkitTextFillColor: theme.palette.text.primary,
    caretColor: theme.palette.text.primary,
  },
  '& .MuiInputBase-input': {
    padding: '12.5px 10px',
  },
  '.MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.divider,
  },
}));

export const TextField = ({
  label,
  ...props
}: Omit<TextFieldProps, 'variant' | 'label'> & { label: string }) => {
  return (
    <FormControl fullWidth={props.fullWidth} variant="standard">
      <StyledInputLabel shrink htmlFor={props.id} required={props.required}>
        {label}
      </StyledInputLabel>
      <StyledTextField {...props} />
    </FormControl>
  );
};
