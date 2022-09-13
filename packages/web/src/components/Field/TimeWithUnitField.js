import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MenuItem } from '@material-ui/core';
import { TIME_UNIT_OPTIONS } from 'shared/constants';
import { NumberInput } from './NumberField';
import { TextInput } from './TextField';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';

const FieldWrapper = styled.div`
  display: flex;
`;

const MainField = styled(NumberInput)`
  flex: 1;
  margin-right: 6px;
`;

const Select = styled(TextInput)`
  width: 98px;

  .MuiSvgIcon-root {
    color: ${props => props.theme.palette.grey['400']};
  }
`;

const HiddenInput = styled(TextInput)`
  position: absolute;

  fieldset {
    display: none;
  }
`;

const HiddenField = props => <HiddenInput {...props} type="hidden" />;

export const TimeWithUnitInput = ({
  onChange,
  value: valueInMinutes,
  label,
  name,
  min = 0,
  max,
  step,
  className,
  ...props
}) => {
  const [unit, setUnit] = useState(TIME_UNIT_OPTIONS[0].unit);
  const [value, setValue] = useState(0);
  const selectedOption = TIME_UNIT_OPTIONS.find(o => o.unit === unit);

  useEffect(() => {
    if (!valueInMinutes) {
      return;
    }

    const multiple = TIME_UNIT_OPTIONS.sort((a, b) => b.minutes - a.minutes).find(
      o => valueInMinutes % o.minutes === 0,
    );
    setUnit(multiple.unit);
    const newValue = valueInMinutes / multiple.minutes;
    setValue(newValue);
  }, []);

  const updateExternalValue = newValueInMinutes => {
    onChange({ target: { value: newValueInMinutes, name } });
  };

  const onValueChange = event => {
    const newValue = event.target.value;
    setValue(newValue);
    updateExternalValue(newValue * selectedOption.minutes);
  };

  const onUnitChange = event => {
    const newUnit = event.target.value;
    setUnit(newUnit);

    const newOption = TIME_UNIT_OPTIONS.find(o => o.unit === newUnit);
    updateExternalValue(value * newOption.minutes);
  };

  return (
    <OuterLabelFieldWrapper label={label} className={className} {...props}>
      <FieldWrapper>
        <MainField
          value={value}
          onChange={onValueChange}
          min={min}
          max={max}
          step={step}
          {...props}
        />
        <Select select onChange={onUnitChange} value={unit}>
          {TIME_UNIT_OPTIONS.sort((a, b) => a.minutes - b.minutes).map(option => (
            <MenuItem key={option.unit} value={option.unit}>
              {option.unit}
            </MenuItem>
          ))}
        </Select>
      </FieldWrapper>
      <HiddenField name={name} value={valueInMinutes || 0} />
    </OuterLabelFieldWrapper>
  );
};

export const TimeWithUnitField = ({ field, ...props }) => (
  <TimeWithUnitInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);
