import React from 'react';
import styled from 'styled-components';
import moment from 'moment';
import PropTypes from 'prop-types';
import { TextInput } from './TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import CalendarToday from '@material-ui/icons/CalendarToday';

function fromRFC3339(rfc3339Date, format) {
  if(!rfc3339Date) return;

  return moment.utc(rfc3339Date).format(format);
}

function toRFC3339(date, format) {
  return moment.utc(date, format).format();
}

export const TimeInput = props => <DateInput type="time" format="HH:mm" {...props} />;

export const DateTimeInput = props => (
  <DateInput type="datetime-local" format="YYYY-MM-DDTHH:mm" {...props} />
);

const CalendarIcon = styled(CalendarToday)`
  color: #cccccc;
`;

export const DateInput = ({ type="date", value, format="YYYY-MM-DD", onChange, name, ...props }) => {
  const [currentValue, setCurrentValue] = React.useState(fromRFC3339(value, format));

  const onValueChange = React.useCallback((event) => {
    const formattedValue = event.target.value;
    const rfcValue = toRFC3339(formattedValue, format);

    setCurrentValue(value);
    if(rfcValue === "Invalid date") {
      onChange({ target: { value: '', name } });
      return;
    }

    onChange({ target: { value: rfcValue, name } });
  }, [onChange, format]);

  React.useEffect(() => {
    const formattedValue = fromRFC3339(value, format);
    setCurrentValue(formattedValue);
  }, [value, format]);

  return (
    <TextInput
      type={type}
      value={currentValue}
      onChange={onValueChange}
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
