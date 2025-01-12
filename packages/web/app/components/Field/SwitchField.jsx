import React from 'react';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { styled } from '@mui/material/styles';
import { Colors } from '../../constants';

const StyledSwitch = styled(Switch)`
  height: 45px;
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  .MuiSwitch-thumb {
    position: absolute;
    top: 15px;
    left: 3px;
    width: 14px;
    height: 14px;
  }
  .MuiSwitch-track {
    height: 20px;
    width: 40px;
    background-color: ${Colors.softText};
    opacity: 1;
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
