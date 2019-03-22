import React from 'react';
import PropTypes from 'prop-types';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';

export const CheckInput = ({ label, value, ...props }) => (
  <FormControlLabel
    control={(
      <Checkbox
        checked={value}
        value="checked"
        {...props}
      />
)}
    label={label}
  />
);

export const CheckField = (props) => (
  <CheckInput {...props} />
);

CheckField.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

CheckField.defaultProps = {
  value: false,
};
