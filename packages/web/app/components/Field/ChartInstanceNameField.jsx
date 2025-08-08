import React from 'react';
import styled from 'styled-components';
import { LimitedTextField } from './TextField';

const StyledLimitedTextField = styled(LimitedTextField)`
  .MuiFormHelperText-root.MuiFormHelperText-contained {
    font-weight: 400;
    ${props => props.helperText ? '' : 'text-align: right;'}
  }
`;

export const ChartInstanceNameField = (props) => {
  const { error, field, form } = props;
  const errorMessage = error ? form.errors[field.name] : null;

  return (
    <StyledLimitedTextField
      {...props}
      limit={15}
      helperText={errorMessage}
    />
  );
};
