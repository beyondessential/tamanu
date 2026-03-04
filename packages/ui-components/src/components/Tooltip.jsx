import React from 'react';
import styled, { css } from 'styled-components';
import { Tooltip } from '@material-ui/core';
import { TAMANU_COLORS } from '../constants';

export const ThemedTooltip = styled(props => (
  <Tooltip
    classes={{ popper: props.className }}
    placement="top"
    arrow
    {...props}
    data-testid="tooltip-b4e8"
  />
))`
  .MuiTooltip-tooltip {
    background-color: ${TAMANU_COLORS.primaryDark};
    font-weight: 400;
    font-size: 0.6875rem;
    padding: 0.375rem 0.5rem;
    text-align: center;
    ${({ $maxWidth }) =>
      $maxWidth &&
      css`
        max-inline-size: ${$maxWidth};
      `}

    ${({ $border }) =>
      $border &&
      css`
        border: ${$border};
      `}
  }
  .MuiTooltip-arrow {
    color: ${TAMANU_COLORS.primaryDark};

    &::before {
      ${({ $border }) =>
        $border &&
        css`
          border: 1px solid ${TAMANU_COLORS.outline};
        `}
    }
  }
`;

export const ConditionalTooltip = ({ visible, children, maxWidth, ...restProps }) => {
  if (!visible) return children;
  return (
    //  Below div is needed to make ThemedTooltip work
    <ThemedTooltip $maxWidth={maxWidth} {...restProps} data-testid="themedtooltip-50xj">
      <div className="conditional-tooltip-container">{children}</div>
    </ThemedTooltip>
  );
};
