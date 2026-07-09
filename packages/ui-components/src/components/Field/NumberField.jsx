import React from 'react';
import { InputAdornment } from '@material-ui/core';
import { TAMANU_COLORS } from '../../constants/colors';
import { TextInput } from './TextField';

export const NumberInput = ({
  min,
  max,
  step,
  unit,
  inputProps = {},
  InputProps = {},
  ...props
}) => (
  <TextInput
    {...props}
    inputProps={{
      min,
      max,
      step,
      ...(unit && { style: { flex: 'none', width: '5ch', paddingInline: '15px 3px' } }),
      ...inputProps,
    }}
    InputProps={{
      ...InputProps,
      ...(unit && {
        endAdornment: (
          <InputAdornment position="end" style={{ marginLeft: '0px' }}>
            <span style={{ color: TAMANU_COLORS.softText, fontSize: '14px', whiteSpace: 'nowrap' }}>
              {unit}
            </span>
          </InputAdornment>
        ),
      }),
    }}
    type="number"
    onWheel={event => {
      // Prevents increasing/decreasing the value. It needs to be blurred because
      // it's not possible to prevent the event default behavior.
      // This makes the element no longer focused and so the value is not changed.
      event.target.blur();
    }}
  />
);

export const NumberField = ({ field, ...props }) => (
  <NumberInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);
