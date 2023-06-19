import React, { useState, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { isAfter, isBefore, parse } from 'date-fns';
import {
  toDateString,
  toDateTimeString,
  format as formatDate,
} from '@tamanu/shared/utils/dateTime';
import PropTypes from 'prop-types';
import { TextInput } from './TextField';
import { Colors } from '../../constants';

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

// Here I have made a data URL for the new calendar icon. The existing calander icon was a psuedo element
// in the user agent shadow DOM. In order to add a new icon I had to make the psuedo element invisible
// a new icon I had to make the psuedo element invisible and render a replacement on top using svg data url.
const CustomIconTextInput = styled(TextInput)`
  input::-webkit-calendar-picker-indicator {
    color: rgba(0, 0, 0, 0);
    opacity: 1;
    background-image: url("data:image/svg+xml,%3Csvg width='14' height='14' viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg' %3E%3Cpath d='M13.125 1.75H11.375V0H8.75V1.75H5.25V0H2.625V1.75H0.875C0.392 1.75 0 2.142 0 2.625V13.125C0 13.608 0.392 14 0.875 14H13.125C13.608 14 14 13.608 14 13.125V2.625C14 2.142 13.608 1.75 13.125 1.75ZM12.25 12.25H1.75V6.125H12.25V12.25Z' fill='%23326699' /%3E%3C/svg%3E");
    cursor: pointer;
    border-radius: 50%;
    margin-left: 0.5rem;
  }
`;

function fromRFC3339(rfc3339Date, format) {
  if (!rfc3339Date) return '';
  return formatDate(rfc3339Date, format);
}

export const DateInput = ({
  type = 'date',
  value,
  format = 'yyyy-MM-dd',
  onChange,
  name,
  placeholder,
  max = '9999-12-31',
  min,
  saveDateAsString = false,
  ...props
}) => {
  const [currentText, setCurrentText] = useState(fromRFC3339(value, format));
  const [isPlaceholder, setIsPlaceholder] = useState(!value);

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

      if (min) {
        const minDate = parse(min, format, new Date());
        if (isBefore(date, minDate)) {
          onChange({ target: { value: '', name } });
          return;
        }
      }

      let outputValue;
      if (saveDateAsString) {
        if (type === 'date') outputValue = toDateString(date);
        else if (['time', 'datetime-local'].includes(type)) outputValue = toDateTimeString(date);
      } else {
        outputValue = date.toISOString();
      }
      setIsPlaceholder(false);
      setCurrentText(formattedValue);
      if (outputValue === 'Invalid date') {
        onChange({ target: { value: '', name } });
        return;
      }

      onChange({ target: { value: outputValue, name } });
    },
    [onChange, format, name, min, max, saveDateAsString, type],
  );

  useEffect(() => {
    const formattedValue = fromRFC3339(value, format);
    if (value && formattedValue) {
      setCurrentText(formattedValue);
      setIsPlaceholder(false);
    }
    return () => {
      setCurrentText('');
      setIsPlaceholder(true);
    };
  }, [value, format]);

  return (
    <CustomIconTextInput
      type={type}
      value={currentText}
      onChange={onValueChange}
      InputProps={{
        // Set max property on HTML input element to force 4-digit year value (max year being 9999)
        inputProps: { max, min },
      }}
      style={isPlaceholder ? { color: Colors.softText } : undefined}
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
