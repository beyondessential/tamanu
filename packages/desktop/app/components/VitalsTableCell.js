import React from 'react';
import styled from 'styled-components';
import { Colors } from '../constants';
import { formatLong, formatShortest, formatTime } from './DateDisplay';
import { TableTooltip } from './Table/TableTooltip';

const VitalsCellWrapper = styled.div`
  background: ${({ severity }) =>
    severity === 'alert' ? 'rgba(247, 104, 83, 0.2)' : 'transparent'};
  border-radius: 10px;
  padding: 8px 14px;
  margin: -8px ${({ severity }) => (severity === 'alert' ? '0px' : '-14px')};
  width: fit-content;
`;

const VitalsHeadCellWrapper = styled.div`
  display: block;
  width: fit-content;
  div {
    color: ${Colors.midText};
    :first-child {
      color: ${Colors.darkText};
    }
  }
`;

export const VitalsTableHeadCell = React.memo(({ date }) => (
  <TableTooltip title={formatLong(date)}>
    <VitalsHeadCellWrapper>
      <div>{formatShortest(date)}</div>
      <div>{formatTime(date)}</div>
    </VitalsHeadCellWrapper>
  </TableTooltip>
));

export const VitalsTableCell = React.memo(({ value, tooltip, severity }) =>
  tooltip ? (
    <TableTooltip title={tooltip}>
      <VitalsCellWrapper severity={severity}>{value}</VitalsCellWrapper>
    </TableTooltip>
  ) : (
    <VitalsCellWrapper>{value}</VitalsCellWrapper>
  ),
);
