import React, { useState, useCallback, useEffect } from 'react';
import { format as formatDate, isAfter, parse } from 'date-fns';
import PropTypes from 'prop-types';
import { TextInput } from './TextField';
import { toDateTimeString } from '../../utils/dateTime';

// This component is pretty tricky! It has to keep track of two layers of state:
//
//  - actual date, received from `value` and emitted through `onChange`
//    this is always in RFC3339 format (which looks like "1996-12-19T16:39:57")
//
//  - currently entered date, which might be only partially entered
//    this is a string in whatever format that has been given to the
//    component through the `format` prop.
//
// As the string formats don't contain timezone information, the RFC3339 dates are
// always in UTC - leaving it up to the local timezone can introduce some wacky
// behaviour as the dates get converted back and forth.
//
// Care has to be taken with setting the string value, as the native date control
// has some unusual input handling (switching focus between day/month/year etc) that
// a value change will interfere with.

function fromRFC3339(rfc3339Date, format) {
  if (!rfc3339Date) return '';

  return formatDate(new Date(rfc3339Date), format);
}

export const DateInput = ({
  type = 'date',
  value,
  format = 'yyyy-MM-dd',
  onChange,
  name,
  placeholder,
  max = '9999-12-31',
  saveDateAsString = false,
  ...props
}) => {
  const [currentText, setCurrentText] = useState(fromRFC3339(value, format));

  const onValueChange = useCallback(
    event => {
      const formattedValue = event.target.value;
      const date = parse(formattedValue, format, new Date());

      if (max) {
        const maxDate = parse(max, format, new Date());
        if (isAfter(date, maxDate)) {
          onChange({ target: { value: '', name } });
          return;
        }
      }

      const outputValue = saveDateAsString ? toDateTimeString(date) : date.toISOString();

      setCurrentText(formattedValue);
      if (outputValue === 'Invalid date') {
        onChange({ target: { value: '', name } });
        return;
      }

      onChange({ target: { value: outputValue, name } });
    },
    [onChange, format, name, max, saveDateAsString],
  );

  useEffect(() => {
    const formattedValue = fromRFC3339(value, format);
    if (value && formattedValue) {
      setCurrentText(formattedValue);
    }
    return () => setCurrentText('');
  }, [value, format]);

  return (
    <TextInput
      type={type}
      value={currentText}
      onChange={onValueChange}
      InputProps={{
        // Set max property on HTML input element to force 4-digit year value (max year being 9999)
        inputProps: { max },
      }}
      {...props}
    />
  );
};

export const TimeInput = props => <DateInput type="time" format="HH:mm" {...props} />;

export const DateTimeInput = props => (
  <DateInput type="datetime-local" format="yyyy-MM-dd'T'HH:mm" max="9999-12-31T00:00" {...props} />
);

export const DateField = ({ field, ...props }) => (
  <DateInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);

export const TimeField = ({ field, ...props }) => (
  <TimeInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);

export const DateTimeField = ({ field, ...props }) => (
  <DateTimeInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);

DateInput.propTypes = {
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  onChange: PropTypes.func,
  fullWidth: PropTypes.bool,
  format: PropTypes.string,
};

DateInput.defaultProps = {
  name: '',
  onChange: () => null,
  value: '',
  fullWidth: true,
  format: 'yyyy-MM-dd',
};
