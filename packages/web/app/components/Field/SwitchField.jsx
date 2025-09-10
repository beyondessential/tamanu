import { TAMANU_COLORS } from '@tamanu/ui-components';
import React from 'react';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { styled } from '@mui/material/styles';

const StyledSwitch = styled(Switch)`
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 1.25rem;
  width: 3rem;
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
    background-color: ${TAMANU_COLORS.white};
  }
  .MuiSwitch-track {
    height: 1.25rem;
    width: 2.5rem;
    background-color: ${TAMANU_COLORS.softText};
    opacity: 1;
    border-radius: 1.25rem;
  }

  .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track {
    background-color: ${TAMANU_COLORS.primary};
    opacity: 1;
  }
  .MuiSwitch-switchBase.Mui-disabled.Mui-checked + .MuiSwitch-track {
    background-color: ${TAMANU_COLORS.primary30};
    opacity: 1;
  }
`;

const StyledFormControlLabel = styled(FormControlLabel)`
  margin-left: 0;
  .MuiFormControlLabel-label.Mui-disabled {
    color: ${TAMANU_COLORS.darkestText};
  }
`;

export const SwitchInput = ({ label, disabled, value, className, ...props }) => {
  const handleChange = (event) => {
    event.target.value = event.target.checked;
    props.onChange(event);
  };
  return (
    <StyledFormControlLabel
      control={
        <StyledSwitch
          value={value}
          checked={!!value}
          {...props}
          onChange={handleChange}
          data-testid="styledswitch-wyw7"
        />
      }
      label={label}
      disabled={disabled}
      className={className}
      data-testid="styledformcontrollabel-y8xy"
    />
  );
};

export const SwitchField = ({ field, ...props }) => (
  <SwitchInput
    name={field.name}
    value={field.value}
    onChange={field.onChange}
    {...props}
    data-testid="switchinput-bt2i"
  />
);
