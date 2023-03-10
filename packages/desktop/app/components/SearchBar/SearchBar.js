import React from 'react';
import styled from 'styled-components';
import ExpandMore from '@material-ui/icons/ExpandMore';
import { IconButton, Box } from '@material-ui/core';
import { Button } from '../Button';

export const SearchBarContainer = styled.div`
  font-size: 11px;

  .MuiInputBase-input {
    font-size: 11px;
  }
  .label-field {
    font-size: 11px;
  }

  .display-field {
    .MuiSvgIcon-root {
      font-size: 16px;
    }
  }
`;

export const SearchBarSubmitButtons = ({ clearForm, clickToggle, ...props }) => {
  return (
    <Box display="flex" alignItems="flex-end" justifyContent="space-between" {...props}>
      <IconButton onClick={clickToggle} color="primary">
        <ExpandMore />
      </IconButton>
      <Button type="submit">Search</Button>
      <Button variant="text" style={{ marginLeft: 12 }} onClick={clearForm}>
        Clear
      </Button>
    </Box>
  );
};
