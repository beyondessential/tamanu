import React from 'react';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { styled } from '@mui/material/styles';
import { Colors } from '../../constants';

const StyledSwitch = styled(Switch)`
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 1.25rem;
  width: 3rem;
  .MuiFormControlLabel-root {
    margin-left: 0;
  }
  .MuiButtonBase-root {
    padding: 0;
  }
  .MuiTouchRipple-root {
    display: none;
  }
  .MuiSwitch-thumb {
    position: absolute;
    inset-block-start: 0.188rem;
    inset-inline-start: 0.188rem;
    width: 0.875rem;
    height: 0.875rem;
    box-shadow: none;
    background-color: ${Colors.white};
  }
  .MuiSwitch-track {
    height: 1.25rem;
    width: 2.5rem;
    background-color: ${Colors.softText};
    opacity: 1;
    border-radius: 1.25rem;
  }

  .Mui-checked + .MuiSwitch-track {
    background-color: ${Colors.primary};
    opacity: 1;
  }
`;

export const SwitchInput = ({ label, disabled, value, ...props }) => {
  return (
    <FormControlLabel
      control={<StyledSwitch value={value} {...props} />}
      label={label}
      disabled={disabled}
    />
  );
};

export const SwitchField = ({ field, ...props }) => (
  <SwitchInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);
