import React from 'react';
import styled from 'styled-components';
import MuiTextField from '@material-ui/core/TextField';
import MuiMenuItem from '@material-ui/core/MenuItem';
import PropTypes from 'prop-types';
import { OuterLabelFieldWrapper } from './OuterLabelFieldWrapper';
import { Colors } from '../../constants';

const StyledTextField = styled(MuiTextField)`
  div:first-child {
    background: ${props => (props.disabled ? 'rgba(0, 0, 0, 0)' : Colors.white)};
    color: ${Colors.darkText};
  }
`;

export const SelectInput = ({ options, value, label, classes, ...props }) => (
  <OuterLabelFieldWrapper label={label} {...props}>
    <StyledTextField select value={value || ''} variant="outlined" classes={classes} {...props}>
      {options.map(o => (
        <MuiMenuItem key={o.value} value={o.value}>
          {o.label}
        </MuiMenuItem>
      ))}
    </StyledTextField>
  </OuterLabelFieldWrapper>
);

export const SelectField = ({ field, ...props }) => (
  <SelectInput name={field.name} value={field.value || ''} onChange={field.onChange} {...props} />
);

SelectInput.propTypes = {
  name: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(PropTypes.instanceOf(Object)),
  fullWidth: PropTypes.bool,
};

SelectInput.defaultProps = {
  value: '',
  options: [],
  fullWidth: true,
};
