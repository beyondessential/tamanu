import React from 'react';
import PropTypes from 'prop-types';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { withStyles } from '@material-ui/core/styles';
import CheckBoxOutlined from '@material-ui/icons/CheckBoxOutlined';

const inputStyles = () => ({
  root: {
    paddingTop: 0,
    paddingBottom: 0,
    width: 'max-content',
  },
  controlLabel: {
    width: 'max-content',
  },
});

export const CheckInput = withStyles(inputStyles)(({ label, value, style, ...props }) => (
  <FormControlLabel
    className={props.classes.controlLabel}
    control={
      <Checkbox
        checkedIcon={<CheckBoxOutlined />}
        color="primary"
        checked={value}
        value="checked"
        {...props}
      />
    }
    style={style}
    label={label}
  />
));

export const CheckField = ({ field, error, helperText, ...props }) => (
  <CheckInput
    name={field.name}
    value={field.value || false}
    onChange={field.onChange}
    error={error || undefined}
    {...props}
  />
);

CheckInput.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.bool,
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

CheckInput.defaultProps = {
  value: false,
  label: '',
};
