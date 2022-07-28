import React, { useState, useCallback, useEffect } from 'react';
import moment from 'moment';
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

function toMomentDate(date, format) {
  return moment(date, format);
}

function fromRFC3339(rfc3339Date, format) {
  if (!rfc3339Date) return '';

  return moment(rfc3339Date).format(format);
}

export const DateInput = ({
  type = 'date',
  value,
  format = 'YYYY-MM-DD',
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
      const date = toMomentDate(formattedValue, format);

      if (max) {
        const maxDate = toMomentDate(max, format);
        if (date.isAfter(maxDate)) {
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
  <DateInput type="datetime-local" format="YYYY-MM-DDTHH:mm" max="9999-12-31T00:00" {...props} />
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
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(moment),
    PropTypes.instanceOf(Date),
  ]),
  onChange: PropTypes.func,
  fullWidth: PropTypes.bool,
  format: PropTypes.string,
};

DateInput.defaultProps = {
  name: '',
  onChange: () => null,
  value: '',
  fullWidth: true,
  format: 'YYYY-MM-DD',
};
