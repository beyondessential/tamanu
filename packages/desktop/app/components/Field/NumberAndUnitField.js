import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MenuItem } from '@material-ui/core';
import { NumberInput } from './NumberField';
import { TextInput } from './TextField';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';

const FieldWrapper = styled.div`
  display: flex;
`;

const MainField = styled(NumberInput)`
  flex: 1;
`;

const Select = styled(TextInput)`
  width: 95px;
  margin-left: -2px;
  margin-right: -2px;

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

const HiddenField = props => {
  return <HiddenInput {...props} type="hidden" />;
};

const UNIT_OPTIONS = [
  { value: 'minutes', label: 'minutes', minutes: 1 },
  { value: 'hours', label: 'hours', minutes: 60 },
  { value: 'days', label: 'days', minutes: 1440 },
  { value: 'weeks', label: 'weeks', minutes: 10080 },
];

export const NumberAndUnitInput = ({ onChange, value, label, name, min, max, step, className }) => {
  const [unit, setUnit] = useState(UNIT_OPTIONS[0].value);
  const selectedOption = UNIT_OPTIONS.find(o => o.value === unit);
  const valueInMinutes = value ? value * selectedOption.minutes : 0;

  useEffect(() => {
    const multiple = UNIT_OPTIONS.sort((a, b) => b.minutes - a.minutes).find(
      o => value % o.minutes === 0,
    );
    if (multiple.minutes > 1) {
      setUnit(multiple.value);
    }
    const newValue = value / multiple.minutes;
    onChange({ target: { value: newValue, name } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onUnitChange = event => {
    const newUnit = event.target.value;
    setUnit(newUnit);
  };

  return (
    <OuterLabelFieldWrapper label={label} className={className}>
      <FieldWrapper>
        <MainField value={value || 0} onChange={onChange} min={min} max={max} step={step} />
        <Select select onChange={onUnitChange} value={unit}>
          {UNIT_OPTIONS.sort((a, b) => a.minutes - b.minutes).map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FieldWrapper>
      <HiddenField name={name} value={valueInMinutes} />
    </OuterLabelFieldWrapper>
  );
};

export const NumberAndUnitField = ({ field, ...props }) => (
  <NumberAndUnitField name={field.name} value={field.value} onChange={field.onChange} {...props} />
);
