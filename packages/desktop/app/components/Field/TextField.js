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
    ${props =>
      props.style?.color ? `color: ${props.style.color}` : `color: ${Colors.darkestText}`};
    padding: 13px 12px 13px 15px;
    line-height: 18px;
    ${props => (props.style?.minHeight ? `min-height: ${props.style.minHeight}` : '')};
    ${props => (props.style?.padding ? `padding: ${props.style.padding}` : '')};

    font-size: ${props => (props.size === 'small' ? '11px' : '15px')};

    &::placeholder {
      color: ${Colors.softText};
      opacity: 1;
    }
  }

  // helper text
  .MuiFormHelperText-root {
    font-weight: 500;
    font-size: 12px;
    line-height: 15px;
    margin: 4px 2px 2px;
  }

  // Hover state
  .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
    border-color: ${props => props.theme.palette.grey['400']};
  }

  // Focused state
  .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border: 1px solid ${props => props.theme.palette.primary.main};
  }

  // Place holder color when focused
  .MuiInputBase-input:focus::-webkit-input-placeholder {
    color: ${Colors.midText};
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
