import React from 'react';
import styled from 'styled-components';
import { InputAdornment } from '@material-ui/core';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { TAMANU_COLORS } from '../../constants/colors';
import { TextInput } from './TextField';

// Unit-bearing number inputs hide the native browser spinner and render their own
// always-visible stepper at the right edge instead (see UnitStepper below).
const UnitNumberInput = styled(TextInput)`
  input {
    -moz-appearance: textfield;
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
`;

const UnitStepper = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: auto;
`;

// The stepper is a visual affordance only — the input itself stays fully keyboard-operable
// (arrow keys still step a focused number input), so the buttons are hidden from the
// accessibility tree rather than given (translated) labels of their own.
const UnitStepperButton = styled.button`
  border: none;
  background: none;
  padding: 0;
  height: 10px;
  line-height: 0;
  cursor: pointer;
  color: ${TAMANU_COLORS.darkestText};

  &:disabled {
    color: ${TAMANU_COLORS.softText};
    cursor: default;
  }

  svg {
    font-size: 16px;
  }
`;

export const NumberInput = ({
  min,
  max,
  step = 1,
  unit,
  inputProps = {},
  InputProps = {},
  ...props
}) => {
  const { name, value, onChange, disabled } = props;

  const stepBy = direction => {
    const current = Number(value);
    const next = (Number.isFinite(current) ? current : 0) + direction * Number(step);
    const clamped = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, next));
    onChange?.({ target: { name, value: clamped } });
  };

  const InputComponent = unit ? UnitNumberInput : TextInput;

  return (
    <InputComponent
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
            <>
              <InputAdornment position="end" style={{ marginLeft: '0px' }}>
                <span
                  style={{ color: TAMANU_COLORS.softText, fontSize: '14px', whiteSpace: 'nowrap' }}
                >
                  {unit}
                </span>
              </InputAdornment>
              <UnitStepper aria-hidden="true">
                <UnitStepperButton
                  type="button"
                  tabIndex={-1}
                  disabled={disabled}
                  onClick={() => stepBy(1)}
                >
                  <KeyboardArrowUp />
                </UnitStepperButton>
                <UnitStepperButton
                  type="button"
                  tabIndex={-1}
                  disabled={disabled}
                  onClick={() => stepBy(-1)}
                >
                  <KeyboardArrowDown />
                </UnitStepperButton>
              </UnitStepper>
            </>
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
};

export const NumberField = ({ field, ...props }) => (
  <NumberInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);
