import React from 'react';
import { FormControl, InputLabel, InputBase, styled } from '@mui/material';

const StyledTextField = styled(InputBase)(({ theme }) => ({
    'label + &': {
      marginTop: theme.spacing(3),
    },
  }));
  

export const TextField = ({ label, ...props }: { label: string; [key: string]: any }) => {
  return (
    <FormControl variant="standard">
      <InputLabel shrink htmlFor={props.id}>
        {label}
      </InputLabel>
      <StyledTextField {...props} />
    </FormControl>
  );
};
