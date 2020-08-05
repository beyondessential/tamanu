import React from 'react';
import MuiTextField from '@material-ui/core/TextField';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { Colors } from '../../constants';

const StyledTextField = styled(MuiTextField)`
  .MuiInputBase-root {
    background: ${props => (props.disabled ? 'none' : Colors.white)};
  }

  // The actual input field
  .MuiInputBase-input {
    color: ${Colors.darkestText};
    padding: 12px 12px;
    font-size: 15px;
    line-height: 18px;
  }

  // helper text
  .MuiFormHelperText-root {
    margin-left: 2px;
    margin-top: 2px;
    letter-spacing: 0;
  }

  // Hover state
  .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
    border-color: ${props => props.theme.palette.grey['400']};
  }

  // Focused state
  .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border: 1px solid #67a6e3;
    box-shadow: 0 0 4px rgba(50, 102, 153, 0.25);
  }

  .MuiFormLabel-root.Mui-focused {
    color: ${props => props.theme.palette.text.primary};
  }

  .MuiOutlinedInput-multiline {
    padding: 0;
  }

  .MuiInputAdornment-positionStart {
    margin-right: 0;
  }
`;

export const TextInput = ({ value = '', label, ...props }) => (
  <OuterLabelFieldWrapper label={label} {...props}>
    <StyledTextField value={value} variant="outlined" {...props} />
  </OuterLabelFieldWrapper>
);

export const TextField = ({ field, ...props }) => (
  <TextInput name={field.name} value={field.value || ''} onChange={field.onChange} {...props} />
);

TextInput.propTypes = {
  name: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  fullWidth: PropTypes.bool,
};

TextInput.defaultProps = {
  name: undefined,
  onChange: undefined,
  value: '',
  fullWidth: true,
};
