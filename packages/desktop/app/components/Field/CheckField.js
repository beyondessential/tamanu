import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import { Colors } from '../../constants';

const CheckControl = React.memo(({ value, ...props }) => (
  <Checkbox
    icon={<i className="far fa-square" />}
    checkedIcon={<i className="far fa-check-square" />}
    checked={value}
    value="checked"
    {...props}
  />
));

const ControlLabel = styled(FormControlLabel)`
  align-items: flex-start;

  i,
  .MuiTypography-root {
    font-size: 16px;
    line-height: 18px;
  }
  i.fa-check-square {
    color: ${Colors.primary};
  }
  i.fa-square {
    color: ${Colors.softText};
  }

  .fa-square {
    color: #dedede;
  }
`;

const ControlCheck = styled(CheckControl)`
  padding-top: 0;
  padding-bottom: 0;
  margin-left: 3px;
  width: max-content;
`;

export const CheckInput = React.memo(
  ({ label, value, className, style, error, helperText, ...props }) => (
    <FormControl style={style} className={className} error={error}>
      <ControlLabel
        control={<ControlCheck value={value} {...props} />}
        style={style}
        label={label}
      />
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  ),
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
