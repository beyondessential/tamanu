import React from 'react';
import styled from 'styled-components';
import Tooltip from '@material-ui/core/Tooltip';
import { Colors } from '../../constants';

// The text is clamped rather than the tooltip, so hiding the overflow does not also clip the arrow,
// which sits outside the tooltip's box. Unclipped, text past the clamp spills over the hovered
// cell, catching the pointer and closing the tooltip in a loop.
const TooltipText = styled.div`
  display: -webkit-box;
  -webkit-line-clamp: 10;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const TableTooltip = styled(({ className, children, placement = 'top', title, ...props }) => (
  <Tooltip
    classes={{ popper: className }}
    arrow
    placement={placement}
    title={title ? <TooltipText>{title}</TooltipText> : title}
    {...props}
    data-testid="tooltip-5on2"
  >
    {children}
  </Tooltip>
))`
  z-index: 1500;
  pointer-events: auto;

  & .MuiTooltip-tooltip {
    background-color: ${Colors.primaryDark};
    color: ${Colors.white};
    font-weight: 400;
    font-size: 0.6875rem;
    line-height: 15px;
    white-space: pre-line;
    padding: 0.375rem 0.5rem;
    cursor: pointer;
    max-width: 500px;
    text-align: center;
    & .MuiTooltip-arrow {
      color: ${Colors.primaryDark};
    }
  }
`;
