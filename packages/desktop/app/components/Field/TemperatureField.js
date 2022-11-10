import React, { useState } from 'react';
import convert from 'convert';
import styled from 'styled-components';
import { PropTypes } from 'prop-types';
import { NumberInput } from './NumberField';
import { TextInput } from './TextField';
import { useLocalisation } from '../../contexts/Localisation';

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
    toMetric: T => convert(parseFloat(T), 'fahrenheit').to('celsius'),
  },
};

// metricValue is the actual form value that gets saved to the db. It is stored in the hidden
// field and externally updated in the onChange handler. The internal value is private to this
// component and is just used for displaying the value in the unit that is configured.
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
  const { getLocalisation } = useLocalisation();
  const { label, toMetric } = TEMPERATURE_OPTIONS[getLocalisation('units.temperature')];
  const [internalValue, setInternalValue] = useState(defaultValue);

  const onValueChange = event => {
    const newInternalValue = event.target.value;
    setInternalValue(newInternalValue);
    const newMetricValue =
      typeof toMetric === 'function' ? toMetric(newInternalValue) : newInternalValue;

    // Update external form value (ie. formik)
    onChange({ target: { value: newMetricValue, name } });
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
