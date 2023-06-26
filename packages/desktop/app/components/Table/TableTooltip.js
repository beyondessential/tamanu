import React from 'react';
import styled from 'styled-components';
import Tooltip from '@material-ui/core/Tooltip';
import { Colors } from '../../constants';

export const TableTooltip = styled(({ className, children, placement = 'top', ...props }) => (
  <Tooltip classes={{ popper: className }} arrow placement={placement} {...props}>
    {children}
  </Tooltip>
))`
  z-index: 1500;
  pointer-events: auto;

  & .MuiTooltip-tooltip {
    background-color: ${Colors.primaryDark};
    color: ${Colors.white};
    font-weight: 400;
    font-size: 11px;
    line-height: 15px;
    white-space: pre-line;
    cursor: pointer;
    max-width: 500px;
    display: -webkit-box;
    -webkit-line-clamp: 10;
    -webkit-box-orient: vertical;
    text-align: center;
    & .MuiTooltip-arrow {
      color: ${Colors.primaryDark};
    }
  }
`;

export const LimitedLinesCell = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
`;

export const CellWithTooltip = styled(({ className, children, placement = 'top', ...props }) => (
  <Tooltip classes={{ popper: className }} arrow placement={placement} {...props}>
    <LimitedLinesCell>
      {children}
    </LimitedLinesCell>
  </Tooltip>
))`
  z-index: 1500;
  pointer-events: auto;

  & .MuiTooltip-tooltip {
    background-color: ${Colors.primaryDark};
    color: ${Colors.white};
    font-weight: 400;
    font-size: 11px;
    line-height: 15px;
    white-space: pre-line;
    cursor: pointer;
    max-width: 500px;
    display: -webkit-box;
    -webkit-line-clamp: 10;
    -webkit-box-orient: vertical;
    text-align: center;
    & .MuiTooltip-arrow {
      color: ${Colors.primaryDark};
    }
  }
`;

