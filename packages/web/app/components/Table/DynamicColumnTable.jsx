import React from 'react';
import styled from 'styled-components';
import { Box } from '@mui/material';
import { Table } from './Table';
import { Colors } from '../../constants';

const StyledTable = styled(Table)`
  overflow-x: auto;
  overflow-y: hidden;
  table {
    position: relative;
    thead tr th:first-child,
    tbody tr td:first-child {
      left: 0;
      position: sticky;
      border-right: 2px solid ${Colors.outline};
    }
    thead tr th:first-child {
      background: ${Colors.background};
      width: 160px;
      min-width: 160px;
    }
    thead tr th:not(:first-child):not(:last-child) {
      /* Each data column is fixed width except the last one, which takes the rest of the space */
      width: 115px;
    }
    tbody tr td:first-child {
      background: ${Colors.white};
    }
    tfoot tr td button {
      position: sticky;
      left: 16px;
    }
    ${props =>
      props.isBodyScrollable &&
      `
      thead  {
        position: sticky;
        top: 0;
        z-index: 2;
      }
    `}
  }
`;

// Used for vitals and charts
export const DynamicColumnTable = React.memo(({ showFooterLegend, ...props }) => {
  return (
    <>
      <StyledTable {...props} data-testid="styledtable-03tr" />
      {showFooterLegend && (
        <Box
          textAlign="end"
          marginTop="8px"
          fontSize="9px"
          color={Colors.softText}
          data-testid="box-q7pq"
        >
          *Changed record
        </Box>
      )}
    </>
  );
});
