import React from 'react';
import styled from 'styled-components';

import { Typography, Box } from '@material-ui/core';

const Table = styled(Box)`
  border-top: 1px solid black;
  border-left: 1px solid black;
  margin-top: 10px;
  margin-bottom: 16px;
`;

const Row = styled(Box)`
  display: grid;
  grid-template-columns: ${props => props.$gridTemplateColumns};
  border-bottom: 1px solid black;
`;

const Cell = styled(Box)`
  border-right: 1px solid black;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
`;

const Text = styled(Typography)`
  font-size: 14px;
`;
const StrongText = styled(Text)`
  font-weight: 600;
`;

export const ListTable = ({ columns, data, gridTemplateColumns }) => {
  return (
    <Table>
      <Row $gridTemplateColumns={gridTemplateColumns}>
        {columns.map(({ title, style = { paddingLeft: '1rem' } }) => (
          <Cell>
            <StrongText style={style}>{title}</StrongText>
          </Cell>
        ))}
      </Row>
      {data.map(row => (
        <Row $gridTemplateColumns={gridTemplateColumns}>
          {columns.map(({ key, accessor, style = { paddingLeft: '1rem' } }) => (
            <Cell>
              <Text style={style}>{accessor ? accessor(row) : row[key]}</Text>
            </Cell>
          ))}
        </Row>
      ))}
    </Table>
  );
};
