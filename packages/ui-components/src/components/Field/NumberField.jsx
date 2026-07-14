import React from 'react';
import InputAdornment, { inputAdornmentClasses } from '@mui/material/InputAdornment';
import { typographyClasses } from '@mui/material/Typography';
import styled from 'styled-components';

import { TextInput } from './TextField';
import { TAMANU_COLORS } from '../../constants/colors';

const TextInputWithUnit = styled(TextInput)`
  .MuiInputBase-root {
    display: grid;
    grid-template-columns: minmax(4ch, 6ch) auto;
  }
`;

const UnitAdornment = styled(InputAdornment).attrs({ position: 'end' })`
  &.${inputAdornmentClasses.root} {
    margin-inline: 0;
  }
  .${typographyClasses.root} {
    font-size: inherit;
    color: ${TAMANU_COLORS.softText};
    white-space: nowrap;
  }
`;

/**
 * Prevents increasing/decreasing the value. It needs to be blurred because it’s not possible to
 * prevent the event default behavior. This makes the element no longer focused and so the value is
 * not changed.
 */
const onWheel = event => void event.target.blur();

export const NumberInput = ({ inputProps, InputProps, max, min, step, unit, ...props }) => {
  const Component = unit ? TextInputWithUnit : TextInput;
  const endAdornment = unit ? <UnitAdornment>{unit}</UnitAdornment> : null;

  return (
    <Component
      {...props}
      inputProps={{
        min,
        max,
        step,
        ...inputProps,
      }}
      InputProps={{
        ...InputProps,
        endAdornment,
      }}
      type="number"
      onWheel={onWheel}
    />
  );
};

export const NumberField = ({ field, ...props }) => (
  <NumberInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);
