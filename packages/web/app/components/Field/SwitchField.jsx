import React from 'react';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { styled } from '@mui/material/styles';

const StyledSwitch = styled(Switch)`
    .Mui-checked {
     & + .MuiSwitch-track {
        background-color:#C2D2E1;
        }
`;

export const SwitchInput = ({ label, disabled, value, ...props }) => {
  return (
    <FormControlLabel
      control={<StyledSwitch checked={value} {...props} />}
      label={label}
      disabled={disabled}
    />
  );
};

export const SwitchField = ({ field, ...props }) => (
  <SwitchInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);
