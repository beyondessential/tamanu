import React, { useState, useEffect } from 'react';
import convert from 'convert';
import { ReturnKeyTypeOptions } from 'react-native';
import { BaseInputProps } from '../../interfaces/BaseInputProps';
import { TextField } from '../TextField/TextField';
import { useLocalisation } from '/contexts/LocalisationContext';

const TEMPERATURE_OPTIONS = {
  celsius: { label: 'Temperature (ºC)' },
  fahrenheit: {
    label: 'Temperature (ºF)',
    toMetric: (T: string) => convert(parseFloat(T), 'fahrenheit').to('celsius'),
  },
};

export interface TemperatureFieldProps extends BaseInputProps {
  value?: string;
  onChange?: (text: any) => void;
  isOpen?: boolean;
  placeholder?: '' | string;
  disabled?: boolean;
  secure?: boolean;
  hints?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  autoFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

// The internal value is private to this component and is just used for displaying the value in the unit
// that is configured. Formik values are simply updated using the onChange method on mobile rather than being
// hooked up by the name prop as they are on desktop.
export const TemperatureField = (props: TemperatureFieldProps): JSX.Element => {
  const {
    isOpen,
    placeholder,
    disabled,
    secure,
    hints,
    returnKeyType,
    autoFocus,
    onFocus,
    onBlur,
  } = props;
  const [internalValue, setInternalValue] = useState(undefined);
  const { getString } = useLocalisation();
  const unitSetting = getString('units.temperature', 'celsius');

  const { label, toMetric } = TEMPERATURE_OPTIONS[unitSetting];

  const onChangeTemperature = (newValue: string): void => {
    if (Number.isNaN(newValue)) {
      setInternalValue(undefined);
      return;
    }
    setInternalValue(newValue);

    // Update the actual form value
    if (props.onChange) {
      // If we are not already in metric than convert to the value to metric
      const newMetricValue =
        typeof toMetric === 'function' ? toMetric(newValue) : parseFloat(newValue);

      props.onChange(parseFloat(newMetricValue));
    }
  };

  // Handle passed in values
  useEffect((): void => {
    if (props.value === undefined || Number.isNaN(props.value)) {
      setInternalValue(undefined);
      return;
    }

    const newMetricValue = typeof toMetric === 'function' ? toMetric(internalValue) : internalValue;
    if (props.value !== newMetricValue) {
      setInternalValue(props.value);
    }
  }, [props.value]);

  return (
    <TextField
      label={label}
      isOpen={isOpen}
      placeholder={placeholder}
      disabled={disabled}
      secure={secure}
      hints={hints}
      returnKeyType={returnKeyType}
      autoFocus={autoFocus}
      onFocus={onFocus}
      onBlur={onBlur}
      value={internalValue === undefined ? '' : internalValue.toString()}
      onChange={onChangeTemperature}
      keyboardType="numeric"
    />
  );
};
