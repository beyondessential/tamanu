import React from 'react';
import styled from 'styled-components';
import Tooltip from '@material-ui/core/Tooltip';
import { TAMANU_COLORS } from '@tamanu/ui-components';


export const TableTooltip = styled(({ className, children, placement = 'top', ...props }) => (
  <Tooltip
    classes={{ popper: className }}
    arrow
    placement={placement}
    {...props}
    data-testid="tooltip-5on2"
  >
    {children}
  </Tooltip>
))`
  z-index: 1500;
  pointer-events: auto;

  & .MuiTooltip-tooltip {
    background-color: ${TAMANU_COLORS.primaryDark};
    color: ${TAMANU_COLORS.white};
    font-weight: 400;
    font-size: 0.6875rem;
    line-height: 15px;
    white-space: pre-line;
    padding: 0.375rem 0.5rem;
    cursor: pointer;
    max-width: 500px;
    display: -webkit-box;
    -webkit-line-clamp: 10;
    -webkit-box-orient: vertical;
    text-align: center;
    & .MuiTooltip-arrow {
      color: ${TAMANU_COLORS.primaryDark};
    }
  }
`;
