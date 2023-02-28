import React from 'react';
import { Typography, Box } from '@material-ui/core';
import styled from 'styled-components';

const Container = styled.div`
  border: 1px solid #dedede;
  border-radius: 5px;
  overflow: hidden;
  .table-container {
    border: none;
  }
`;

export function TableWithSearchBarContainer({ table, searchBar, title }) {
  return (
    <Box>
      <Typography variant="h6" style={{ fontSize: 14, marginTop: 12, marginBottom: 8 }}>
        {title}
      </Typography>
      <Container>
        {searchBar}
        {table}
      </Container>
    </Box>
  );
}
