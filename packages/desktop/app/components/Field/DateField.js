import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { TextInput } from './TextField';

function toDate(momentValue) {
  return momentValue ? moment(momentValue).format('YYYY-MM-DD') : '';
}

function fromDate(changeEvent) {
  const value = changeEvent.target.value;
  return [moment(value).format('YYYY-MM-DD'), changeEvent];
}

export const DateInput = (props) => (
  <TextInput
    type="date"
    InputLabelProps={{ shrink: true }}
    {...props}
  />
);

export const DateField = ({ value, onChange, ...props }) => (
  <DateInput
    fullWidth
    value={toDate(value)}
    onChange={(e) => onChange(fromDate(e))}
    {...props}
  />
);

DateField.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(moment)]),
  onChange: PropTypes.func.isRequired,
};

DateField.defaultProps = {
  value: '',
};
