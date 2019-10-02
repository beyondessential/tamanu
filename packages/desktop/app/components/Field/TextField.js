import React from 'react';
import MuiTextField from '@material-ui/core/TextField';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { Colors } from '../../constants';

const StyledTextField = styled(MuiTextField)`
  div:first-child {
    background: ${Colors.white};
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
