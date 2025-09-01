import React from 'react';
import { FormControl, InputLabel, TextField as MuiTextField, styled } from '@mui/material';

const StyledInputLabel = styled(InputLabel)(({ theme }) => ({
  fontSize: '14px',
  fontWeight: 500,
  '& .MuiFormLabel-asterisk': {
    color: theme.palette.error.main,
  }
}));

const StyledTextField = styled(MuiTextField)(({ theme }) => ({
  'label + &': {
    marginTop: theme.spacing(2),
  },
  '& .MuiInputBase-input': {
    padding: '12.5px 10px',
  },
  '& .MuiInputBase-root': {
    width: '100%',
  },
}));

export const TextField = ({ label, ...props }: { label: string; [key: string]: any }) => {
  return (
    <FormControl fullWidth={props.fullWidth} variant="standard">
      <StyledInputLabel shrink htmlFor={props.id} required={props.required}>
        {label}
      </StyledInputLabel>
      <StyledTextField {...props} />
    </FormControl>
  );
};
