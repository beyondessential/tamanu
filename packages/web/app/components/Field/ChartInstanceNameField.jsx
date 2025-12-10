import React from 'react';
import styled from 'styled-components';
import { LimitedTextField } from './TextField';

const StyledLimitedTextField = styled(LimitedTextField)`
  .MuiFormHelperText-root.MuiFormHelperText-contained {
    font-weight: 400;
    ${props => props.helperText ? '' : 'text-align: right;'}
  }
`;

const getErrorMessage = (error, form, field) => {
  if (!error || !form?.errors || !field?.name) {
    return null;
  }

  return form.errors[field.name];
};

export const ChartInstanceNameField = (props) => {
  const { error, field, form } = props;
  const errorMessage = getErrorMessage(error, form, field);

  return (
    <StyledLimitedTextField
      {...props}
      limit={15}
      helperText={errorMessage}
    />
  );
};
