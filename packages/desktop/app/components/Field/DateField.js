import React from 'react';

import moment from 'moment';

import { TextInput } from './TextField';

function toDate(momentValue) {
  return momentValue && moment(momentValue).format('YYYY-MM-DD');
}

function fromDate(changeEvent) {
  const value = changeEvent.target.value;
  changeEvent.target.value = moment(value).format('YYYY-MM-DD');
  return changeEvent;
}

export const DateInput = (props) => (
  <TextInput
    type="date"
    InputLabelProps={{ shrink: true }}
    {...props}
  />
);

export const DateField = ({ field, ...props }) => (
  <DateInput
    name={ field.name }
    value={ toDate(field.value) }
    onChange={ (e) => field.onChange(fromDate(e)) }
    {...props}
  />
);

