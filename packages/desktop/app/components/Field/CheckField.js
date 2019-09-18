import React from 'react';
import PropTypes from 'prop-types';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
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

const CheckControl = React.memo(({ value, classes, ...props }) => (
  <Checkbox
    checkedIcon={<CheckBoxOutlined />}
    color="primary"
    checked={value}
    value="checked"
    classes={classes}
    {...props}
  />
));

export const CheckInput = withStyles(inputStyles)(
  React.memo(({ label, value, style, error, helperText, classes, ...props }) => (
    <FormControl style={style} error={error}>
      <FormControlLabel
        className={classes.controlLabel}
        control={<CheckControl value={value} classes={{ root: classes.root }} {...props} />}
        style={style}
        label={label}
      />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  )),
);

export const CheckField = React.memo(({ field, error, ...props }) => (
  <CheckInput
    name={field.name}
    value={field.value || false}
    onChange={field.onChange}
    error={error}
    {...props}
  />
));

CheckInput.propTypes = {
  name: PropTypes.string,
  value: PropTypes.bool,
  label: PropTypes.string,
  onChange: PropTypes.func,
};

CheckInput.defaultProps = {
  value: false,
  label: '',
  onChange: undefined,
  name: undefined,
};
