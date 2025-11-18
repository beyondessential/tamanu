import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';

const StyledItemCell = styled(Box)`
  .MuiFormHelperText-root {
    font-size: 14px;
  }
`;

const ViewOnlyCell = styled.div`
  display: flex;
  font-size: 14px;
  padding-left: 15px;
`;

export const CodeCell = ({ item }) => (
  <StyledItemCell width="10%">
    <ViewOnlyCell>{item.productCode}</ViewOnlyCell>
  </StyledItemCell>
);
