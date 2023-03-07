import React from 'react';
import { Typography, Box } from '@material-ui/core';
import styled from 'styled-components';

const Container = styled.div`
  border: 1px solid #dedede;
  border-radius: 5px;
  overflow: hidden;
`;

const Header = styled(Typography)`
  font-size: 14px;
  margin-top: 12px;
  margin-bottom: 8px;
`;

export function TableWithSearchBarContainer({ table, searchBar, title }) {
  const borderlessTable = React.useMemo(() => {
    return React.cloneElement(table, {
      containerStyle: { border: 'none' },
    });
  }, [table]);
  return (
    <Box>
      <Header variant="h6">{title}</Header>
      <Container>
        {searchBar}
        {borderlessTable}
      </Container>
    </Box>
  );
}
