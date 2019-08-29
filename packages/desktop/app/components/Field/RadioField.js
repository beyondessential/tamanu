import React from 'react';
import PropTypes from 'prop-types';
import {
  Radio,
  RadioGroup,
  FormLabel,
  FormControlLabel,
  FormControl,
  FormHelperText,
  withStyles,
} from '@material-ui/core';

const styles = () => ({
  control: {
    background: '#fff',
    margin: 0,
    padding: '15px 8px',
    border: '1px solid rgba(0, 0, 0, 0.23)',
    '& span:last-of-type': {
      // target: label
      color: '#999999',
    },
    '& span': {
      // targets: radio and label
      padding: '0 3px 0 0',
    },
    '&:not(:last-of-type)': {
      // targets: options
      borderRight: 'none',
    },
    '&:first-of-type': {
      borderRadius: '3px 0 0 3px',
    },
    '&:last-of-type': {
      borderRadius: '0 3px 3px 0',
    },
  },
  checkedControl: {
    background: '#FAFAFA',
    '& span:last-of-type': {
      // target: label
      color: '#666666',
    },
  },
  radio: {
    color: '#cccccc',
  },
  checkedRadio: {
    '&$checkedRadio': {
      color: '#4285F4',
    },
  },
});

export const RadioInput = withStyles(styles)(
  ({ options, name, value, label, helperText, inline, style, classes, ...props }) => (
    <FormControl style={style} {...props}>
      <FormLabel>{label}</FormLabel>
      <RadioGroup
        aria-label={name}
        name={name}
        value={value || ''}
        style={{ flexDirection: inline ? 'row' : 'column' }}
        {...props}
      >
        {options.map(option => (
          <FormControlLabel
            className={`${classes.control} ${value === option.value && classes.checkedControl}`}
            key={option.value}
            control={
              <Radio className={classes.radio} classes={{ checked: classes.checkedRadio }} />
            }
            label={option.label}
            value={option.value}
          />
        ))}
      </RadioGroup>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  ),
);

export const RadioField = ({ field, error, ...props }) => (
  <RadioInput
    name={field.name}
    value={field.value || ''}
    onChange={field.onChange}
    error={error || undefined}
    {...props}
  />
);

RadioInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.instanceOf(Object)).isRequired,
  inline: PropTypes.bool, // display radio options in single line
};

RadioInput.defaultProps = {
  value: false,
  inline: false,
};
