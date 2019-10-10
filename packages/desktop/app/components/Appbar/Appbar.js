import React from 'react';
import styled from 'styled-components';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';

const StyledAppbar = styled.div`
  grid-row: 1 / 2;
  grid-column: 2 / -1;

  header {
    box-shadow: none;
  }
`;

export const Appbar = () => {
  return (
    <StyledAppbar>
      <AppBar position="static">
        <Toolbar>{/* TODO: Search etc.. will go here */}</Toolbar>
      </AppBar>
    </StyledAppbar>
  );
};
