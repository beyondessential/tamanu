import React from 'react';
import styled from 'styled-components';

import { PatientPortalFormStatusChipRoot } from './PatientPortalFormStatusChip';

const Card = styled.div`
  border-radius: 3px;
  border: 1px solid #dedede;
  display: grid;
  font-size: 14px;
  grid-template-columns: minmax(0, 1fr) minmax(0, max-content);
  line-height: 1.3;
  min-block-size: 4lh;
  padding: 1rem;
  row-gap: 6px;
`;

const EmptyState = styled.div`
  position: absolute;
  inset: 0;
`;

const Table = styled.table`
  border-collapse: collapse;
  column-gap: 20px;
  display: grid;
  grid-template-columns: minmax(min-content, 1fr) minmax(0, 3fr);
  margin: 0;
  padding: 0;

  tr {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
  }

  &,
  * {
    border: none;
    text-align: start;
  }
`;

const Key = styled.th.attrs({ scope: 'row' })`
  font-weight: 400;
`;

const Value = styled.td`
  font-weight: 500;
`;

export const PatientPortalKVCard = ({ dict, formStatus, ...props }) => {
  const hasData = dict !== null && typeof dict === 'object';

  return (
    <Card {...props}>
      {hasData ? (
        <>
          <Table>
            {Object.entries(dict).map(([key, value], i) => (
              <tr key={i}>
                <Key>{key}</Key>
                <Value>{value}</Value>
              </tr>
            ))}
          </Table>
          {formStatus && <PatientPortalFormStatusChipRoot status={formStatus} />}
        </>
      ) : (
        <EmptyState>No data 😢</EmptyState>
      )}
    </Card>
  );
};
