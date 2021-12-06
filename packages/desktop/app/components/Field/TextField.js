import React from 'react';
import MuiTextField from '@material-ui/core/TextField';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { Colors } from '../../constants';

export const StyledTextField = styled(MuiTextField)`
  .MuiInputBase-root {
    background: ${props => (props.disabled ? 'inherit' : Colors.white)};
  }

  // The actual input field
  .MuiInputBase-input {
    color: ${Colors.darkestText};
    padding: 12px 12px;
    font-size: 15px;
    line-height: 18px;
    ${props => props.style?.minHeight ? `min-height: ${props.style.minHeight}` : ''};
    ${props => props.style?.padding ? `padding: ${props.style.padding}` : ''};
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

  // text area fields
  .MuiOutlinedInput-multiline {
    padding: 0 0 5px 0;
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

export const LimitedTextField = ({ limit = 255, ...props }) => (
  <TextField {...props} inputProps={{ maxLength: limit }} />
);

export const TextField = ({ field, ...props }) => (
  <TextInput name={field.name} value={field.value || ''} onChange={field.onChange} {...props} />
);

export const MultilineTextField = ({ field, ...props }) => (
  <TextInput
    multiline
    name={field.name}
    value={field.value || ''}
    onChange={field.onChange}
    {...props}
  />
);

export const ReadOnlyTextField = ({ field, ...props }) => (
  <TextInput
    disabled
    name={field.name}
    value={field.value || ''}
    onChange={field.onChange}
    {...props}
  />
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
