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
