import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import CheckBoxOutlined from '@material-ui/icons/CheckBoxOutlined';

const CheckControl = React.memo(({ value, ...props }) => (
  <Checkbox
    checkedIcon={<CheckBoxOutlined />}
    color="primary"
    checked={value}
    value="checked"
    {...props}
  />
));

const ControlLabel = styled(FormControlLabel)`
  width: max-content;
`;

const ControlCheck = styled(CheckControl)`
  padding-top: 0;
  padding-bottom: 0px;
  width: max-content;
`;

export const CheckInput = React.memo(({ label, value, style, error, helperText, ...props }) => (
  <FormControl style={style} error={error}>
    <ControlLabel control={<ControlCheck value={value} {...props} />} style={style} label={label} />
    {helperText && <FormHelperText>{helperText}</FormHelperText>}
  </FormControl>
));

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
