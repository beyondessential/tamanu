import React from 'react';
import styled from 'styled-components';
import { Button as MuiButton } from '@material-ui/core';

const StyledButton = styled(MuiButton)`
  font-weight: 500;
  font-size: 14px;
  line-height: 18px;
  text-transform: none;
  padding: 11px 18px 12px 18px;
  box-shadow: none;
  min-width: 100px;
  border-radius: 3px;
`;

export const Button = props => <StyledButton color="primary" {...props} />;
