import React from 'react';
import styled from 'styled-components';

import { PatientPortalFormStatusChipRoot } from './PatientPortalFormStatusChip';

const Card = styled.table`
  border-radius: 3px;
  border: 1px solid #dedede;
  display: grid;
  line-height: 1.3;
  padding: 1rem;
  row-gap: 6px;
`;

const Table = styled.table`
  border-collapse: collapse;
  column-gap: 20px;
  display: grid;
  font-size: 14px;
  grid-template-columns: minmax(min-content, 70px) minmax(0, 1fr);
  margin: 0;
  padding: 0;

  tr {
    display: grid;
    grid-template-columns: subgrid;
  }

  &,
  * {
    border: none;
  }
`;

const Key = styled.th.attrs({ scope: 'row' })`
  font-weight: 400;
`;

const Value = styled.td`
  font-weight: 500;
`;

export const KeyValueDisplayCard = ({ dict, formStatus, ...props }) => {
  return (
    <Card {...props}>
      <Table>
        {Object.entries(dict).map(([key, value], i) => (
          <tr key={i}>
            <Key>{key}</Key>
            <Value>{value}</Value>
          </tr>
        ))}
      </Table>
    </Card>
  );
};
