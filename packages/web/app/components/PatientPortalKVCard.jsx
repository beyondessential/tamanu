import React from 'react';
import styled from 'styled-components';

const Card = styled.div`
  border-radius: 3px;
  border: 1px solid #dedede;
  column-gap: 20px;
  display: grid;
  font-size: 14px;
  grid-template-columns: minmax(min-content, 70px) minmax(0, 1fr);
  line-height: 1.3;
  padding: 1rem;
  row-gap: 6px;

  table {
    border-collapse: collapse;

    &,
    * {
      border: none;
    }
  }
`;

const Key = styled.th.attrs({ scope: 'row' })`
  font-weight: 400;
  line-height: 1.3;
`;

const Value = styled.td`
  font-weight: 500;
  line-height: 1.3;
`;

export const KeyValueDisplayCard = ({ dict, ...props }) => {
  return (
    <Card {...props}>
      <table>
        {Object.entries(dict).map(([key, value], i) => (
          <tr key={i}>
            <Key>{key}</Key>
            <Value>{value}</Value>
          </tr>
        ))}
      </table>
    </Card>
  );
};
