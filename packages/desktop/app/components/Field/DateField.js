import React from 'react';
import styled from 'styled-components';
import moment from 'moment';
import PropTypes from 'prop-types';
import { TextInput } from './TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import CalendarToday from '@material-ui/icons/CalendarToday';

export const TimeInput = props => <DateInput type="time" {...props} />;

export const DateTimeInput = props => (
  <DateInput type="datetime-local" {...props} />
);

const CalendarIcon = styled(CalendarToday)`
  color: #cccccc;
`;

export const DateInput = ({ type="date", value, format, onChange, ...props }) => {
  const [currentValue, setCurrentValue] = React.useState(value);
  const change = React.useCallback((event) => {
    const value = event.target.value;
    setCurrentValue(value);
    onChange({ target: { value } });
  }, [onChange]);

  React.useEffect(() => setCurrentValue(value), [value]);

  return (
    <TextInput
      type={type}
      value={currentValue}
      onChange={change}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <CalendarIcon />
          </InputAdornment>
        ),
      }}
      {...props}
    />
  );
}

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
