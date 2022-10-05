import React from 'react';
import styled from 'styled-components';

import { Typography, Box } from '@material-ui/core';

const Table = styled(Box)`
  border-top: 1px solid black;
  border-left: 1px solid black;
  margin-bottom: 16px;
`;

const Row = styled(Box)`
  display: grid;
  grid-template-columns: repeat(${props => props.$columnLength}, minmax(30px, 5fr));
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

export const ListTable = ({ columns, data }) => {
  return (
    <Table>
      <Row $columnLength={columns.length}>
        {columns.map(({ title }) => (
          <Cell>
            <StrongText>{title}</StrongText>
          </Cell>
        ))}
      </Row>
      {data.map(row => (
        <Row $columnLength={columns.length}>
          {columns.map(({ key, accessor }) => (
            <Cell>
              <Text>{accessor ? accessor(row) : row[key]}</Text>
            </Cell>
          ))}
        </Row>
      ))}
    </Table>
  );
};
