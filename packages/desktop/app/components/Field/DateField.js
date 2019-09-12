import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import { TextInput } from './TextField';
import { withStyles } from '@material-ui/core/styles';
import InputAdornment from '@material-ui/core/InputAdornment';
import CalendarToday from '@material-ui/icons/CalendarToday';

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

const dateStyles = () => ({
  icon: {
    color: '#cccccc',
  },
});

export const DateInput = withStyles(dateStyles)(
  ({ value, format, onChange, classes, ...props }) => (
    <TextInput
      type="date"
      {...props}
      classes={{ root: classes.root }}
      value={toDate(value, format)}
      onChange={e => onChange(fromDate(e, format))}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <CalendarToday classes={{ root: classes.icon }} />
          </InputAdornment>
        ),
      }}
    />
  ),
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
