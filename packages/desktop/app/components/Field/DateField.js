import React from 'react';
import styled from 'styled-components';
import moment from 'moment';
import PropTypes from 'prop-types';
import InputAdornment from '@material-ui/core/InputAdornment';
import CalendarToday from '@material-ui/icons/CalendarToday';
import { TextInput } from './TextField';

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

  return moment.utc(rfc3339Date).format(format);
}

function toRFC3339(date, format) {
  return moment.utc(date, format).format();
}

const CalendarIcon = styled(CalendarToday)`
  color: #cccccc;
`;

const DatePlaceholder = styled.div`
  font-size: 11pt;
  color: #8e8e8e;
`;

export const DateInput = ({
  type = 'date',
  value,
  format = 'YYYY-MM-DD',
  onChange,
  name,
  placeholder,
  ...props
}) => {
  const [currentText, setCurrentText] = React.useState(fromRFC3339(value, format));

  const onValueChange = React.useCallback(
    event => {
      const formattedValue = event.target.value;
      const rfcValue = toRFC3339(formattedValue, format);

      setCurrentText(formattedValue);
      if (rfcValue === 'Invalid date') {
        onChange({ target: { value: '', name } });
        return;
      }

      onChange({ target: { value: rfcValue, name } });
    },
    [onChange, format],
  );

  React.useEffect(() => {
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
        startAdornment: (
          <InputAdornment position="start">
            {placeholder ? <DatePlaceholder>{placeholder}</DatePlaceholder> : <CalendarIcon />}
          </InputAdornment>
        ),
      }}
      {...props}
    />
  );
};

export const TimeInput = props => <DateInput type="time" format="HH:mm" {...props} />;

export const DateTimeInput = props => (
  <DateInput type="datetime-local" format="YYYY-MM-DDTHH:mm" {...props} />
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
