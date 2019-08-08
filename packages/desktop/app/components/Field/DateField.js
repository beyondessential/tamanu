import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { TextInput } from './TextField';

function toDate(momentValue, format) {
  return momentValue ? moment(momentValue, format).format(format) : '';
}

function fromDate(changeEvent, format) {
  changeEvent.persist();
  const { value } = changeEvent.target;
  changeEvent.target.value = moment(value, format).format(format);
  return changeEvent;
}

export const TimeInput = props => <DateInput type="time" format="HH:mm" {...props} />;

export const DateTimeInput = props => (
  <DateInput type="datetime-local" format="YYYY-MM-DDTHH:mm" {...props} />
);

export const DateInput = ({ value, format, onChange, ...props }) => (
  <TextInput
    type="date"
    InputLabelProps={{ shrink: true }}
    {...props}
    value={toDate(value, format)}
    onChange={e => onChange(fromDate(e, format))}
  />
);

export const DateField = ({ field, ...props }) => (
  <DateInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);

export const TimeField = ({ field, ...props }) => (
  <TimeInput name={field.name} value={field.value} onChange={field.onChange} {...props} />
);

DateInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(moment)]),
  onChange: PropTypes.func.isRequired,
  fullWidth: PropTypes.bool,
  format: PropTypes.string,
};

DateInput.defaultProps = {
  value: '',
  fullWidth: true,
  format: 'YYYY-MM-DD',
};
