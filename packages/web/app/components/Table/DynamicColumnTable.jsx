import { TAMANU_COLORS } from '@tamanu/ui-components';
import React from 'react';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
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
      border-right: 2px solid ${TAMANU_COLORS.outline};
    }
    thead tr th:first-child {
      background: ${TAMANU_COLORS.background};
      width: 160px;
      min-width: 160px;
    }
    thead tr th:not(:first-child):not(:last-child) {
      /* Each data column is fixed width except the last one, which takes the rest of the space */
      width: 115px;
    }
    tbody tr td:first-child {
      background: ${TAMANU_COLORS.white};
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
          color={TAMANU_COLORS.softText}
          data-testid="box-q7pq"
        >
          *Changed record
        </Box>
      )}
    </>
  );
});
