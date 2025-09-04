import React from 'react';
import styled from 'styled-components';

import { Box, Typography } from '@mui/material';

const Table = styled(Box)`
  border-top: 1px solid black;
  border-left: 1px solid black;
  margin-bottom: 16px;
`;

const Row = styled(Box)`
  display: grid;
  grid-template-columns: 3fr 5fr;
  border-bottom: 1px solid black;
`;

const Cell = styled(Box)`
  border-right: 1px solid black;
  padding-left: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
`;

const Text = styled(Typography)`
  font-size: 14px;
`;
const StrongText = styled(Text)`
  font-weight: 600;
`;

export const GridTable = ({ data }) => {
  return (
    <Table data-testid="table-n0rv">
      {Object.entries(data).map(([key, value], index) => (
        <Row key={key} data-testid="row-9a9y">
          <Cell data-testid="cell-xn4c">
            <StrongText data-testid={`strongtext-yfz4-${index}`}>{key}</StrongText>
          </Cell>
          <Cell data-testid={`cell-x60j-${index}`}>
            <Text data-testid={`text-ombi-${index}`}>{value}</Text>
          </Cell>
        </Row>
      ))}
    </Table>
  );
};
