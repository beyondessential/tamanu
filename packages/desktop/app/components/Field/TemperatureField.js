import React, { useState } from 'react';
import convert from 'convert';
import styled from 'styled-components';
import { PropTypes } from 'prop-types';
import { NumberInput } from './NumberField';
import { TextInput } from './TextField';

const HiddenInput = styled(TextInput)`
  position: absolute;

  fieldset {
    display: none;
  }
`;

const HiddenField = props => <HiddenInput {...props} type="hidden" />;

const TEMPERATURE_OPTIONS = {
  celsius: { label: 'Temperature (ºC)' },
  fahrenheit: {
    label: 'Temperature (ºF)',
    // This needs to convert from ºF back to metric as the internal value is in ºF and the
    // actual form value needs to be in metric
    metricConversion: T =>
      convert(parseFloat(T), 'fahrenheit')
        .to('celsius')
        .toFixed(2),
  },
};

// Todo Replace with real config after testing
const LOCALISATION = { vitals: { temperature: 'celsius' } };

// valueInCelsius is the actual form value. It is stored in the hidden field and externally updated
// in the onChange handler. The internal value is private to this component and is just used for displaying the
// date in the unit that is configured.
export const TemperatureInput = ({
  onChange,
  value: metricValue,
  name,
  min,
  max,
  defaultValue,
  className,
  ...props
}) => {
  const { label, metricConversion } = TEMPERATURE_OPTIONS[LOCALISATION.vitals.temperature];

  // Maybe set to 37 degrees? or null
  const [internalValue, setInternalValue] = useState(defaultValue);

  const onValueChange = event => {
    const newInternalValue = event.target.value;
    setInternalValue(newInternalValue);
    const newMetricValue =
      typeof metricConversion === 'function'
        ? metricConversion(newInternalValue)
        : newInternalValue;
    onChange(newMetricValue);
  };

  return (
    <>
      <NumberInput
        value={internalValue}
        onChange={onValueChange}
        min={min}
        max={max}
        {...props}
        label={label}
      />
      <HiddenField name={name} value={metricValue || 0} />
    </>
  );
};

TemperatureInput.propTypes = {
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  value: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  defaultValue: PropTypes.number,
  className: PropTypes.string,
};

TemperatureInput.defaultProps = {
  onChange: null,
  value: null,
  min: 0,
  max: 999,
  defaultValue: 0,
  className: null,
};

export const TemperatureField = ({ field, ...props }) => (
  <TemperatureInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);
